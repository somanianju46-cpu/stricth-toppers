import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Smartphone, 
  Mail, 
  User, 
  CreditCard, 
  Upload,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PAYMENT_NUMBER = "8660888419";

export default function Enroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    transactionId: '',
    proofUrl: ''
  });
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !formData.name && !formData.email) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user, formData.name, formData.email]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Course not found");
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context not found'));

          // Max dimensions for screenshots (smaller for Base64 storage)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Quality 50% to keep Base64 string small
          const base64 = canvas.toDataURL('image/jpeg', 0.5);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = event.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error("Please fill all student details");
        return;
      }

      // Create draft enrollment so admin sees it immediately
      try {
        setSubmitting(true);
        if (!enrollmentId) {
          const enrollmentData = {
            userId: user?.uid,
            courseId: course.id,
            courseTitle: course.title,
            userName: formData.name,
            userEmail: formData.email,
            userPhone: formData.phone,
            amount: course.price,
            status: 'pending_payment',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, 'enrollments'), enrollmentData);
          setEnrollmentId(docRef.id);
          
          // Also update user profile in Firestore to ensure they show up in admin
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            try {
              await updateDoc(userRef, {
                displayName: formData.name,
                phone: formData.phone,
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.warn("updateDoc failed, trying setDoc:", err);
              await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: formData.name,
                phone: formData.phone,
                role: 'student',
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          }
        } else {
          // Update existing draft if they went back and changed details
          const enrollmentRef = doc(db, 'enrollments', enrollmentId);
          await updateDoc(enrollmentRef, {
            userName: formData.name,
            userEmail: formData.email,
            userPhone: formData.phone,
            updatedAt: serverTimestamp()
          });
        }
        setStep(2);
      } catch (error) {
        console.error("Error creating enrollment draft:", error);
        toast.error("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate progress for Base64 processing
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev >= 95 ? 95 : prev + 5));
      }, 50);

      const base64 = await compressImage(file);
      
      clearInterval(interval);
      setUploadProgress(100);
      setFormData(prev => ({ ...prev, proofUrl: base64 }));
      toast.success("Screenshot processed successfully!");
    } catch (error: any) {
      console.error("Processing error:", error);
      toast.error("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.transactionId) {
      toast.error("Transaction ID is required");
      return;
    }
    if (!formData.proofUrl) {
      toast.error("Please provide a link to your payment screenshot");
      return;
    }

    try {
      setSubmitting(true);
      if (!enrollmentId) {
        // Fallback if somehow they skipped step 1's creation
        const enrollmentData = {
          userId: user?.uid,
          courseId: course.id,
          courseTitle: course.title,
          userName: formData.name,
          userEmail: formData.email,
          userPhone: formData.phone,
          amount: course.price,
          transactionId: formData.transactionId,
          proofUrl: formData.proofUrl,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'enrollments'), enrollmentData);
      } else {
        const enrollmentRef = doc(db, 'enrollments', enrollmentId);
        await updateDoc(enrollmentRef, {
          transactionId: formData.transactionId,
          proofUrl: formData.proofUrl,
          status: 'pending',
          updatedAt: serverTimestamp()
        });
      }
      setStep(4); // Success step
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error("Failed to submit enrollment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container mx-auto p-20 text-center">Loading course details...</div>;
  if (!course) return null;

  return (
    <div className="container mx-auto px-4 py-12 lg:py-20 max-w-2xl">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center z-10 font-bold transition-all duration-300",
              step >= s ? "bg-green-600 text-white scale-110 shadow-lg shadow-green-500/20" : "bg-muted text-muted-foreground"
            )}
          >
            {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">1. Student Details</CardTitle>
                <CardDescription>Please provide your contact information for enrollment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Full Name
                  </label>
                  <Input 
                    placeholder="Enter your full name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" /> Phone Number
                  </label>
                  <Input 
                    placeholder="Enter your phone number" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="pt-4 space-y-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course:</span>
                    <span className="font-bold">{course.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-bold text-green-600">₹{course.price}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white" 
                  onClick={handleNext}
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Next: Payment Info"} <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">2. Payment Instructions</CardTitle>
                <CardDescription>Send the payment to the number below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-4">
                  <div className="text-sm text-primary font-medium uppercase tracking-wider">Payment Number</div>
                  <div className="text-5xl font-black tracking-tighter text-primary">{PAYMENT_NUMBER}</div>
                  <div className="text-sm text-muted-foreground">Send exact amount to this number</div>
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-yellow-600 font-bold">
                    <Info className="w-5 h-5" /> Important Instructions
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                    <li>Pay the exact amount: <span className="font-bold text-foreground">₹{course.price}</span></li>
                    <li>Take a screenshot of the successful transaction.</li>
                    <li>You will need the Transaction ID in the next step.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-lg">Amount to Pay</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">₹{course.price}</div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button variant="outline" className="h-12 px-6" onClick={handleBack}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button className="flex-1 h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white" onClick={handleNext}>
                  I have paid <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">3. Submit Proof</CardTitle>
                <CardDescription>Provide your transaction details for verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Transaction ID
                  </label>
                  <Input 
                    placeholder="Enter the transaction ID" 
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" /> Payment Screenshot
                  </label>
                  
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden min-h-[200px]",
                      isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
                      formData.proofUrl ? "border-green-500/50 bg-green-500/5" : ""
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleFileUpload(files[0]);
                        }
                      }}
                    />

                    {uploading ? (
                      <div className="flex flex-col items-center gap-4 w-full px-8">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium text-green-600">{uploadProgress}% Uploading...</p>
                      </div>
                    ) : formData.proofUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-green-600">Screenshot Uploaded!</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-green-600" onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, proofUrl: '' }));
                        }}>
                          Replace Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold">Click or drag & drop</p>
                          <p className="text-xs text-muted-foreground mt-1">Upload payment screenshot</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our team will verify your payment within 24 hours. Once approved, you will get full access to the course content.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-green-500/10">
                    <p className="text-[11px] font-bold text-green-700">
                      Note: After enrollment is approved by admin, the course link and details will be sent to you on WhatsApp.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button variant="outline" className="h-12 px-6" onClick={handleBack} disabled={submitting}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button 
                  className="flex-1 h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white" 
                  onClick={handleSubmit}
                  disabled={submitting || uploading}
                >
                  {submitting ? "Submitting..." : "Submit Enrollment"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-card text-center py-12">
              <CardContent className="space-y-6">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Submission Received!</h2>
                  <p className="text-muted-foreground text-lg">Your payment is under verification.</p>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We have received your enrollment request. You will be notified once your payment is approved by our admin team.
                  </p>
                  <div className="p-6 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-500/20 max-w-sm mx-auto space-y-3">
                    <div className="flex items-center justify-center gap-2 font-bold text-lg">
                      <Smartphone className="w-6 h-6" /> WhatsApp Delivery
                    </div>
                    <p className="text-sm font-medium opacity-90">
                      After enrollment is approved by admin, the course link and all lesson details will be sent directly to you on WhatsApp.
                    </p>
                    <a 
                      href="https://wa.me/918660888419?text=Hi, I just submitted my enrollment. Please check."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block w-full py-2 bg-white text-green-600 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors"
                    >
                      Message us on WhatsApp
                    </a>
                  </div>
                </div>
                <Button className="mt-8" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
