"use client"

import { useState } from "react"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail, Key, Shield, Sparkles, Clock, CheckCircle } from "lucide-react"

interface PasswordResetFormProps {
  onBack: () => void
}

export default function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await auth.resetPassword(email)
      if (error) throw error
      
      setMessage({ 
        type: "success", 
        text: "Password reset email sent! Check your inbox and follow the instructions to reset your password." 
      })
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-red-900/20 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large background orbs */}
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-r from-orange-400/30 to-red-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-r from-red-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating Icons - Responsive positioning */}
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 animate-float">
          <Key className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400/60" />
        </div>
        <div className="absolute top-16 right-16 sm:top-32 sm:right-32 animate-float" style={{ animationDelay: '1s' }}>
          <Shield className="w-3 h-3 sm:w-5 sm:h-5 text-red-400/60" />
        </div>
        <div className="absolute bottom-16 left-16 sm:bottom-32 sm:left-32 animate-float" style={{ animationDelay: '2s' }}>
          <Mail className="w-3 h-3 sm:w-5 sm:h-5 text-pink-400/60" />
        </div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 animate-float" style={{ animationDelay: '3s' }}>
          <Clock className="w-3 h-3 sm:w-5 sm:h-5 text-orange-400/60" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Spacer */}
        <div className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-16">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-4 sm:mx-6 lg:mx-8">

            <Card className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
        <CardHeader className="text-center pb-6 sm:pb-8 pt-8 sm:pt-12">
          {/* Animated Key Icon */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-lg opacity-50 animate-pulse" />
              </div>
              
              {/* Main Icon Container */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                <Key className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              
              {/* Rotating Ring */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full border-4 border-transparent border-t-orange-500 border-r-red-500 rounded-3xl animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            Don&apos;t worry, it happens to the best of us! <br />
            Enter your email and we&apos;ll send you a secure reset link.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 space-y-6 sm:space-y-8">
          <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="reset-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-orange-500" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 sm:h-14 px-4 pl-12 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20 dark:focus:border-orange-400 dark:focus:ring-orange-400/20 transition-all duration-200 rounded-xl text-base sm:text-lg"
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl relative overflow-hidden group" 
              disabled={loading || !email}
            >
              {loading ? (
                <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Key className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="relative z-10">
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </form>

          {message && (
            <Alert className={`${message.type === "error" ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"} rounded-xl`}>
              <AlertDescription className={message.type === "error" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Info Card */}
          <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-2xl border border-orange-200/50 dark:border-orange-800/50 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-2 h-2 bg-orange-500 rounded-full" />
              <div className="absolute top-8 right-8 w-1 h-1 bg-red-500 rounded-full" />
              <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-pink-500 rounded-full" />
              <div className="absolute bottom-4 right-4 w-2 h-2 bg-orange-500 rounded-full" />
            </div>
            
            <h4 className="font-bold text-orange-900 dark:text-orange-100 mb-3 sm:mb-4 flex items-center text-base sm:text-lg">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-orange-500" />
              Security & Privacy
            </h4>
            
            <div className="space-y-2 sm:space-y-3">
              {[
                { text: "Reset links expire after 1 hour for security", icon: Clock },
                { text: "Your email is encrypted and never shared", icon: Shield },
                { text: "You can only reset from this email address", icon: CheckCircle }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                  <p className="text-orange-800 dark:text-orange-200 font-medium text-xs sm:text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200 h-10 sm:h-12 px-4 sm:px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </div>

          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
            <p className="flex items-center justify-center space-x-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Remember your password? You can always sign in normally.</span>
            </p>
          </div>
        </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="flex-shrink-0 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <p>VulnScope Security Intelligence Platform</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
