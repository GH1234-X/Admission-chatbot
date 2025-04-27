import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  OTPInput, 
  SlotProps 
} from "input-otp";
import { Slot } from "@radix-ui/react-slot";
import { verifyOTP, sendVerificationEmail } from "@/lib/firebase";

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

const OTPVerification = ({ 
  email, 
  onVerificationComplete
}: OTPVerificationProps) => {
  const [otp, setOTP] = useState("");
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && isResendDisabled) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer, isResendDisabled]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      await verifyOTP(otp);
      toast({
        title: "Success!",
        description: "Email verified successfully",
      });
      onVerificationComplete();
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendVerificationEmail();
      setTimer(30);
      setIsResendDisabled(true);
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend code",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Verify your email</h3>
        <p className="text-sm text-gray-500 mt-2">
          We've sent a verification code to {email}
        </p>
      </div>

      <div className="flex justify-center space-x-2">
        <OTPInput
          maxLength={6}
          value={otp}
          onChange={setOTP}
          render={({ slots }) => (
            <div className="flex gap-2">
              {slots.map((slot: SlotProps, idx) => (
                <Slot key={idx} {...slot}>
                  <Input 
                    className="w-10 h-10 text-center"
                    inputMode="numeric"
                  />
                </Slot>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-4">
        <Button 
          onClick={handleVerify} 
          className="w-full"
          disabled={otp.length !== 6 || isVerifying}
        >
          {isVerifying ? "Verifying..." : "Verify Email"}
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isResendDisabled}
            className="text-sm"
          >
            {isResendDisabled 
              ? `Resend code in ${timer}s` 
              : "Resend verification code"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification; 