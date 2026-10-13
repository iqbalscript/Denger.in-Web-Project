import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAmdProvider,
  normalizeAmdBaseUrl,
  probeAmdEndpoint,
} from '../../services/orchestrator/src/providers/amdProvider.ts';

const SECRET = 'sk-amd-test-secret-123456';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function chatBody(content) {
  return { choices: [{ message: { content } }] };
}

/** Records every call and answers with the given handler. */
function stubFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const call = { url: String(url), init, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    return handler(call);
  };
  return { fetchImpl, calls };
}

const request = { systemPrompt: 'sys', userPrompt: 'user', timeoutMs: 2000 };

describe('AMD provider — URL normalisation', () => {
  for (const input of [
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8000/',
    'http://127.0.0.1:8000/v1',
    'http://127.0.0.1:8000/v1/',
    'http://127.0.0.1:8000/v1/chat/completions',
    ' http://127.0.0.1:8000/v1/models ',
  ]) {
    it(`normalises ${JSON.stringify(input)}`, () => {
      assert.equal(normalizeAmdBaseUrl(input), 'http://127.0.0.1:8000/v1');
    });
  }

  it('posts to {base}/v1/chat/completions', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(chatBody('{"ok":true}')));
    const provider = createAmdProvider({ baseUrl: 'http://127.0.0.1:8000/', model: 'm', fetchImpl });
    await provider.generate(request);
    assert.equal(calls[0].url, 'http://127.0.0.1:8000/v1/chat/completions');
    assert.equal(calls[0].init.method, 'POST');
  });
});

describe('AMD provider — configuration', () => {
  it('reports id, isAmd and isConfigured', () => {
    const provider = createAmdProvider({ baseUrl: 'http://x:8000', model: 'qwen', apiKey: '' });
    assert.equal(provider.id, 'amd:qwen');
    assert.equal(provider.isAmd, true);
    assert.equal(provider.isConfigured(), true);
  });

  it('is not configured without baseUrl or model', async () => {
    assert.equal(createAmdProvider({ baseUrl: '', model: 'qwen' }).isConfigured(), false);
    const noModel = createAmdProvider({ baseUrl: 'http://x:8000', model: '' });
    assert.equal(noModel.isConfigured(), false);
    await assert.rejects(noModel.generate(request), /belum dikonfigurasi/);
  });
});

describe('AMD provider — request shape', () => {
  it('sends Bearer auth when an API key is set', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(chatBody('hai')));
    await createAmdProvider({ baseUrl: 'http://x:8000', model: 'm', apiKey: SECRET, fetchImpl }).generate(request);
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${SECRET}`);
  });

  it('omits auth for a loopback endpoint without a key', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(chatBody('hai')));
    await createAmdProvider({ baseUrl: 'http://127.0.0.1:8000', model: 'm', apiKey: '', fetchImpl }).generate(request);
    assert.equal('Authorization' in calls[0].init.headers, false);
  });

  it('leaves response_format out unless JSON mode is enabled', async () => {
    const off = stubFetch(() => jsonResponse(chatBody('x')));
    await createAmdProvider({ baseUrl: 'http://x', model: 'm', jsonMode: false, fetchImpl: off.fetchImpl }).generate(request);
    assert.equal('response_format' in off.calls[0].body, false);

    const on = stubFetch(() => jsonResponse(chatBody('{}')));
    await createAmdProvider({ baseUrl: 'http://x', model: 'm', jsonMode: true, fetchImpl: on.fetchImpl }).generate(request);
    assert.deepEqual(on.calls[0].body.response_format, { type: 'json_object' });
  });

  it('falls back to system + user prompts and uses a low temperature', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(chatBody('x')));
    await createAmdProvider({ baseUrl: 'http://x', model: 'm', fetchImpl }).generate(request);
    assert.deepEqual(calls[0].body.messages, [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'user' },
    ]);
    assert.equal(calls[0].body.model, 'm');
    assert.ok(calls[0].body.temperature <= 0.3);
  });

  it('passes explicit message history through unchanged', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(chatBody('x')));
    const messages = [
      { role: 'system', content: 'a' },
      { role: 'user', content: 'b' },
      { role: 'assistant', content: 'c' },
    ];
    await createAmdProvider({ baseUrl: 'http://x', model: 'm', fetchImpl }).generate({ ...request, messages });
    assert.deepEqual(calls[0].body.messages, messages);
  });

  it('returns the raw message content', async () => {
    const { fetchImpl } = stubFetch(() => jsonResponse(chatBody('{"concerns":[]}')));
    const result = await createAmdProvider({ baseUrl: 'http://x', model: 'm', fetchImpl }).generate(request);
    assert.deepEqual(result, { rawText: '{"concerns":[]}' });
  });
});

describe('AMD provider — failures', () => {
  it('throws on non-2xx without leaking the API key', async () => {
    const { fetchImpl } = stubFetch(() =>
      jsonResponse({ error: { message: `invalid key ${SECRET} (Authorization: Bearer ${SECRET})` } }, 401)
    );
    const provider = createAmdProvider({ baseUrl: 'http://x', model: 'm', apiKey: SECRET, fetchImpl });
    await assert.rejects(provider.generate(request), (error) => {
      assert.match(error.message, /status 401/);
      assert.equal(error.message.includes(SECRET), false);
      return true;
    });
  });

  it('does not leak the key from network errors either', async () => {
    const fetchImpl = async () => {
      throw new Error(`connect ECONNREFUSED with Bearer ${SECRET}`);
    };
    const provider = createAmdProvider({ baseUrl: 'http://x', model: 'm', apiKey: SECRET, fetchImpl });
    await assert.rejects(provider.generate(request), (error) => {
      assert.match(error.message, /tidak dapat dihubungi/);
      assert.equal(error.message.includes(SECRET), false);
      return true;
    });
  });

  it('throws on empty content', async () => {
    for (const body of [chatBody(''), chatBody(null), { choices: [] }, {}]) {
      const { fetchImpl } = stubFetch(() => jsonResponse(body));
      await assert.rejects(
        createAmdProvider({ baseUrl: 'http://x', model: 'm', fetchImpl }).generate(request),
        /tidak mengembalikan konten/
      );
    }
  });

  it('aborts after timeoutMs', async () => {
    const fetchImpl = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    const provider = createAmdProvider({ baseUrl: 'http://x', model: 'm', fetchImpl });
    const started = Date.now();
    await assert.rejects(provider.generate({ ...request, timeoutMs: 50 }), /tidak merespons dalam 50 ms/);
    assert.ok(Date.now() - started < 1000);
  });
});

describe('AMD probe', () => {
  it('reports models, chat latency and JSON-mode support', async () => {
    const { fetchImpl, calls } = stubFetch((call) => {
      if (call.url.endsWith('/models')) return jsonResponse({ data: [{ id: 'Qwen/Qwen2.5-7B-Instruct' }] });
      if (call.body.response_format) return jsonResponse(chatBody('{"status":"siap"}'));
      return jsonResponse(chatBody('siap'));
    });
    const result = await probeAmdEndpoint({ baseUrl: 'http://127.0.0.1:8000', model: '', apiKey: '', fetchImpl });
    assert.equal(result.ok, true);
    assert.deepEqual(result.models, ['Qwen/Qwen2.5-7B-Instruct']);
    assert.equal(result.chatOk, true);
    assert.equal(result.jsonModeOk, true);
    assert.equal(typeof result.latencyMs, 'number');
    assert.equal(calls[0].url, 'http://127.0.0.1:8000/v1/models');
    // Falls back to the first listed model when AMD_MODEL is empty.
    assert.equal(calls[1].body.model, 'Qwen/Qwen2.5-7B-Instruct');
  });

  it('marks JSON mode unsupported when the server rejects response_format', async () => {
    const { fetchImpl } = stubFetch((call) => {
      if (call.url.endsWith('/models')) return jsonResponse({ data: [{ id: 'm' }] });
      if (call.body.response_format) return jsonResponse({ error: { message: 'response_format not supported' } }, 400);
      return jsonResponse(chatBody('siap'));
    });
    const result = await probeAmdEndpoint({ baseUrl: 'http://x', model: 'm', fetchImpl });
    assert.equal(result.ok, true);
    assert.equal(result.chatOk, true);
    assert.equal(result.jsonModeOk, false);
  });

  it('marks JSON mode unsupported when the reply is not JSON', async () => {
    const { fetchImpl } = stubFetch((call) => {
      if (call.url.endsWith('/models')) return jsonResponse({ data: [{ id: 'm' }] });
      return jsonResponse(chatBody('siap, ini bukan json'));
    });
    const result = await probeAmdEndpoint({ baseUrl: 'http://x', model: 'm', fetchImpl });
    assert.equal(result.jsonModeOk, false);
  });

  it('never throws when the endpoint is unreachable', async () => {
    const fetchImpl = async () => {
      throw new Error(`ECONNREFUSED Bearer ${SECRET}`);
    };
    const result = await probeAmdEndpoint({ baseUrl: 'http://x', model: 'm', apiKey: SECRET, fetchImpl });
    assert.equal(result.ok, false);
    assert.equal(result.chatOk, false);
    assert.equal(result.jsonModeOk, null);
    assert.equal(result.latencyMs, null);
    assert.match(result.error, /models gagal/);
    assert.equal(result.error.includes(SECRET), false);
  });

  it('reports chat failure with jsonModeOk null', async () => {
    const { fetchImpl } = stubFetch((call) => {
      if (call.url.endsWith('/models')) return jsonResponse({ data: [{ id: 'm' }] });
      return jsonResponse({ error: { message: 'model loading' } }, 503);
    });
    const result = await probeAmdEndpoint({ baseUrl: 'http://x', model: 'm', fetchImpl });
    assert.equal(result.ok, false);
    assert.equal(result.chatOk, false);
    assert.equal(result.jsonModeOk, null);
    assert.match(result.error, /Chat completion gagal/);
  });

  it('fails cleanly without a base URL', async () => {
    const result = await probeAmdEndpoint({ baseUrl: '', model: 'm', fetchImpl: async () => jsonResponse({}) });
    assert.equal(result.ok, false);
    assert.match(result.error, /AMD_BASE_URL/);
  });
});
