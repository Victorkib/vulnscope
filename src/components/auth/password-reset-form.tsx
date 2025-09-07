"use client"

import { useState } from "react"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>

        {message && (
          <Alert className={`mt-4 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
