import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Lead Flow AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Capture, organize & convert Meta leads faster with AI-powered automation.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Product</h4>
            <div className="space-y-2">
              <Link to="/features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Support</h4>
            <div className="space-y-2">
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              <a href="mailto:support@leadflowai.com" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Email Us</a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">© 2026 Lead Flow AI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
