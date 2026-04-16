const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director, Realty Pro",
    quote: "Lead Flow AI cut our lead response time from 6 hours to under 5 minutes. Our conversion rate doubled in the first month.",
    avatar: "SJ",
  },
  {
    name: "Michael Chen",
    role: "Founder, GrowthLab Agency",
    quote: "Managing leads across 20+ client accounts was chaos. Now everything syncs automatically and each client has their own workspace.",
    avatar: "MC",
  },
  {
    name: "Priya Patel",
    role: "Sales Manager, EduConnect",
    quote: "The AI lead scoring is a game-changer. My team focuses on hot leads first and our close rate increased by 40%.",
    avatar: "PP",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary mb-2">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Loved by businesses</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
