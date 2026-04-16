import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact – Lead Flow AI" },
      { name: "description", content: "Get in touch with the Lead Flow AI team." },
      { property: "og:title", content: "Contact – Lead Flow AI" },
      { property: "og:description", content: "Have questions? We'd love to hear from you." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <section className="py-24">
          <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
            <p className="text-muted-foreground mb-8">Have questions? We'd love to hear from you.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="How can we help?" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <Button className="w-full" size="lg" type="submit">Send Message</Button>
            </form>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
