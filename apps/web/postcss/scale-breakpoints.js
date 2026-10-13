/**
 * Breakpoint Tailwind (`sm:`/`md:`/`lg:`...) dibuat ikut ukuran teks Akses cepat.
 *
 * Ukuran teks besar memperbesar font-size <html>, tetapi media query piksel tetap
 * memakai lebar layar asli, sehingga di laptop 1280px dengan teks 140% navigasi
 * desktop tetap tampil dan terpotong. Plugin ini menggandakan setiap media query
 * lebar untuk tiap skala (lebar x skala) dan membatasinya dengan kelas di <html>:
 *   - tanpa skala: `:root:not(.a11y-scaled) <selector>` (hasil sama seperti bawaan)
 *   - skala 125%: `:root.a11y-scale-125 <selector>` di dalam min-width x 1.25
 * Hasilnya setara zoom peramban: tata letak pindah ke versi lebih sempit.
 * Kelas dipasang oleh components/ui/AccessibilityMenu.tsx.
 */
const SCALES = [
  { className: 'a11y-scale-112', factor: 1.125 },
  { className: 'a11y-scale-125', factor: 1.25 },
  { className: 'a11y-scale-140', factor: 1.4 },
];

const WIDTH_QUERY = /^\(\s*(min|max)-width:\s*(\d+(?:\.\d+)?)px\s*\)$/;
const DONE = Symbol('scaled');

function prefixRules(atRule, prefix) {
  atRule.walkRules((rule) => {
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map((selector) => `${prefix} ${selector}`);
  });
}

const plugin = () => ({
  postcssPlugin: 'scale-breakpoints-with-text-size',
  AtRule: {
    media(atRule) {
      if (atRule[DONE]) return;
      const match = atRule.params.match(WIDTH_QUERY);
      if (!match) return;
      const [, kind, px] = match;

      for (const scale of [...SCALES].reverse()) {
        const clone = atRule.clone({ params: `(${kind}-width: ${Math.round(Number(px) * scale.factor)}px)` });
        clone[DONE] = true;
        prefixRules(clone, `:root.${scale.className}`);
        atRule.after(clone);
      }

      atRule[DONE] = true;
      prefixRules(atRule, ':root:not(.a11y-scaled)');
    },
  },
});
plugin.postcss = true;

module.exports = plugin;
