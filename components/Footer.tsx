// components/Footer.tsx
import React from 'react';

interface FooterLink {
  name: string;
  href: string;
}

const tools: FooterLink[] = [
  { name: 'Encoders', href: '#' },
  { name: 'Generators', href: '#' },
  { name: 'Converters', href: '#' },
  { name: 'Validators', href: '#' },
  { name: 'Formatters', href: '#' },
  { name: 'Network Tools', href: '#' },
];

const product: FooterLink[] = [
  { name: 'Dashboard', href: '#' },
  { name: 'Shortcuts', href: '#' },
  { name: 'Activity Feed', href: '#' },
  { name: 'System Status', href: '#' },
];

const company: FooterLink[] = [
  { name: 'About', href: '#' },
  { name: 'Blog', href: '#' },
  { name: 'Changelog', href: '#' },
  { name: 'Contact', href: '#' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1e1e1e] py-16 relative mb-8">
      <div className="max-w-7xl mx-auto px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://public.readdy.ai/ai/img_res/6ca7fa48-87b8-4bcd-a93b-5fed1345c249.png"
                alt="DevToolbox"
                className="w-8 h-8 object-contain"
              />
              <span className="text-[#00d9ff] font-bold text-lg font-['JetBrains_Mono']">
                DevToolbox
              </span>
            </div>
            <p className="text-sm text-[#666666] leading-relaxed mb-5">
              The all-in-one developer utility hub. 24+ tools, zero friction, always free.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                rel="nofollow"
                className="w-9 h-9 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#888888] hover:text-white hover:border-[#444444] transition-all duration-200 cursor-pointer"
              >
                <i className="ri-github-line text-base"></i>
              </a>
              <a
                href="#"
                rel="nofollow"
                className="w-9 h-9 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#888888] hover:text-white hover:border-[#444444] transition-all duration-200 cursor-pointer"
              >
                <i className="ri-twitter-x-line text-base"></i>
              </a>
              <a
                href="#"
                rel="nofollow"
                className="w-9 h-9 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#888888] hover:text-white hover:border-[#444444] transition-all duration-200 cursor-pointer"
              >
                <i className="ri-discord-line text-base"></i>
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              <a id="footer-tools">Tools</a>
            </h4>
            <ul className="space-y-3">
              {tools.map((tool) => (
                <li key={tool.name}>
                  <a
                    href={tool.href}
                    rel="nofollow"
                    className="text-sm text-[#666666] hover:text-white transition-colors cursor-pointer"
                  >
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              <a id="footer-product">Product</a>
            </h4>
            <ul className="space-y-3">
              {product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    rel="nofollow"
                    className="text-sm text-[#666666] hover:text-white transition-colors cursor-pointer"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              <a id="footer-company">Company</a>
            </h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    rel="nofollow"
                    className="text-sm text-[#666666] hover:text-white transition-colors cursor-pointer"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#1e1e1e] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#444444]">
            © 2026 DevToolbox. Built for developers, by developers.
          </p>
        </div>
      </div>
    </footer>
  );
};