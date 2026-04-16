import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, Mail, Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter">Privacy Policy</h1>
            <p className="text-muted-foreground font-medium">Effective Date: April 15, 2026</p>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="p-8 lg:p-12 space-y-12">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Shield className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Introduction</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to our Course Selling Platform. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information. Our platform is mentored by <strong>Anju Somani</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Eye className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                </div>
                <p className="text-muted-foreground mb-4">When you use our website, we may collect the following information:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Full Name",
                    "Email Address",
                    "Phone Number (WhatsApp enabled)",
                    "Course selection details",
                    "Payment details (Transaction ID & Screenshot)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <FileText className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>We use your information to:</p>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Process your course enrollment</li>
                    <li>Verify your payment</li>
                    <li>Provide access to the course</li>
                    <li>Send course-related updates</li>
                    <li>Share Zoom class links via WhatsApp</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Lock className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">3. Payment Information</h2>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 space-y-4">
                  <p className="text-muted-foreground">
                    We do not process payments directly on our platform. Users are required to make payments manually to the provided number.
                  </p>
                  <p className="font-bold text-foreground">We only collect:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>Transaction ID</li>
                    <li>Payment proof (screenshot)</li>
                  </ul>
                  <p className="text-xs italic">This is used strictly for verification purposes.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <MessageSquare className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">4. Sharing & Storage</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong>Sharing:</strong> We do not sell, trade, or rent your personal information to others. Your information is only used for course access and communication related to your purchase.
                  </p>
                  <p>
                    <strong>Storage:</strong> Your data may be stored securely using browser storage or database systems. We take reasonable steps to protect your information, but we cannot guarantee complete security.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Mail className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Contact Us</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase font-bold">WhatsApp</div>
                      <div className="font-bold">8660888419</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase font-bold">Email</div>
                      <div className="font-bold">somanimayank723@gmail.com</div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-8 border-t text-center">
                <p className="text-sm text-muted-foreground italic">
                  By using our website, you agree to this Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
