import { Link } from "react-router-dom";
import {
  MessageSquare, Zap, Shield, Image as ImageIcon, Users, Palette,
  ArrowRight, Check, Github,
} from "lucide-react";

const Feature = ({ icon: Icon, title, desc }) => (
  <div className="card bg-base-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
    <div className="card-body">
      <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="size-5 text-primary" />
      </div>
      <h3 className="card-title text-lg">{title}</h3>
      <p className="text-base-content/70 text-sm">{desc}</p>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10" />
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 items-center gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <span className="size-2 rounded-full bg-primary animate-pulse" /> Realtime messaging, beautifully done
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
                Connect instantly.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Chat effortlessly.
                </span>
              </h1>
              <p className="text-base-content/70 text-lg max-w-xl">
                Chatty is a modern realtime chat app — secure auth with OTP email verification,
                32 stunning themes, image sharing and a delightful experience on every device.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/signup" className="btn btn-primary gap-2">
                  Get started <ArrowRight className="size-4" />
                </Link>
                <Link to="/login" className="btn btn-ghost">Sign in</Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-base-content/70">
                <span className="flex items-center gap-1.5"><Check className="size-4 text-success" /> Free forever</span>
                <span className="flex items-center gap-1.5"><Check className="size-4 text-success" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="size-4 text-success" /> Open source</span>
              </div>
            </div>

            {/* Preview card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl rounded-3xl" />
              <div className="relative bg-base-100 rounded-2xl shadow-2xl p-4 sm:p-6 border border-base-300">
                <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Chatty</div>
                    <div className="text-xs text-base-content/60">3 friends online</div>
                  </div>
                </div>
                <div className="py-5 space-y-3">
                  <div className="chat chat-start">
                    <div className="chat-bubble chat-bubble-primary text-sm">Hey! Welcome to Chatty 👋</div>
                  </div>
                  <div className="chat chat-end">
                    <div className="chat-bubble text-sm">Looks amazing — feels instant!</div>
                  </div>
                  <div className="chat chat-start">
                    <div className="chat-bubble chat-bubble-secondary text-sm">Try the themes in Settings ✨</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to chat</h2>
          <p className="text-base-content/70 mt-2">Crafted with care, packed with features.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature icon={Zap}        title="Realtime messages"      desc="Socket.io powered. Messages appear the moment they're sent." />
          <Feature icon={Shield}     title="Secure by default"      desc="JWT + httpOnly cookies, bcrypt password hashing, and OTP email verification." />
          <Feature icon={ImageIcon}  title="Share images"           desc="Send photos in any conversation. Stored securely with your messages." />
          <Feature icon={Users}      title="Online presence"        desc="See who's online in realtime, filter contacts by status." />
          <Feature icon={Palette}    title="32 stunning themes"     desc="Cyberpunk to Pastel. Switch themes instantly from Settings." />
          <Feature icon={MessageSquare} title="Pixel-perfect UI"    desc="Built with Tailwind + DaisyUI. Fully responsive on every device." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-base-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Get chatting in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Create your account", d: "Sign up with email and verify with a 6-digit code we send to your inbox." },
              { n: "02", t: "Add your profile",     d: "Upload an avatar and pick your favorite theme from 32 options." },
              { n: "03", t: "Start chatting",       d: "See who's online, pick a contact, and the conversation begins." },
            ].map((s) => (
              <div key={s.n} className="p-6 rounded-2xl bg-base-200">
                <div className="text-5xl font-black text-primary/30">{s.n}</div>
                <h3 className="text-xl font-bold mt-2">{s.t}</h3>
                <p className="text-base-content/70 mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-secondary text-primary-content p-10 sm:p-14 text-center shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to start chatting?</h2>
          <p className="mt-3 opacity-90">Create your free account in seconds.</p>
          <Link to="/signup" className="btn btn-neutral mt-6 gap-2">
            Create account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-base-300">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <span className="font-semibold">Chatty</span>
            <span className="text-sm text-base-content/60">© {new Date().getFullYear()} Chatty. Built with ❤️ for the community.</span>
          </div>
          <a href="#" className="btn btn-ghost btn-sm gap-2"><Github className="size-4" /> View on GitHub</a>
        </div>
      </footer>
    </div>
  );
}