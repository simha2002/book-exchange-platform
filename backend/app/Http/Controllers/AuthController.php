<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\OtpVerification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255|regex:/^[^0-9]+$/',
            'email'       => 'required|email',
            'roll_number' => 'required|string|max:50',
            'password'    => 'required|min:5',
        ], [
            'name.regex' => 'Name must not contain numbers.',
        ]);

        // Check verified email duplicate
        $existingEmail = User::where('email', $request->email)
            ->where('is_email_verified', true)->first();
        if ($existingEmail) {
            return response()->json([
                'errors' => ['email' => ['This email is already registered.']]
            ], 422);
        }

        $rollNum = strtoupper($request->roll_number);

        // Check roll number duplicate (verified only)
        $existingRoll = User::where('roll_number', $rollNum)
            ->where('is_email_verified', true)->first();
        if ($existingRoll) {
            return response()->json([
                'errors' => ['roll_number' => ['This roll number is already registered.']]
            ], 422);
        }

        // Delete unverified accounts with same email or roll number
        User::where('is_email_verified', false)
            ->where(function ($q) use ($request, $rollNum) {
                $q->where('email', $request->email)
                  ->orWhere('roll_number', $rollNum);
            })->delete();

        // Detect department from roll number (TRI/IT/... → IT dept)
        $parts      = explode('/', $rollNum);
        $deptCode   = $parts[1] ?? $parts[0];
        $deptMap    = ['IT' => 'IT', 'ENG' => 'ENGLISH', 'ACC' => 'ACCOUNTS'];
        $department = $deptMap[$deptCode] ?? strtoupper($deptCode);

        $user = User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'roll_number'       => $rollNum,
            'department'        => $department,
            'password'          => Hash::make($request->password),
            'role'              => 'user',
            'is_email_verified' => false,
        ]);

        // Generate + send email OTP
        $otp  = OtpVerification::generate($request->email);
        $sent = false;
        try {
            $this->sendOtpMail($request->email, $request->name, $otp->otp);
            $sent = true;
        } catch (\Exception $e) {
            \Log::warning('Mail failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => $sent
                ? 'OTP sent to your email. Please verify to continue.'
                : 'Account created. Check your email for OTP.',
            'email'   => $request->email,
            'dev_otp' => (!$sent && config('app.debug')) ? $otp->otp : null,
        ], 201);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|digits:5',
        ]);

        $record = OtpVerification::where('email', $request->email)
            ->where('used', false)->latest()->first();

        if (!$record)             return response()->json(['message' => 'No OTP found. Please register again.'], 422);
        if ($record->isExpired()) return response()->json(['message' => 'OTP expired. Please register again.'], 422);
        if ($record->otp !== $request->otp) return response()->json(['message' => 'Invalid OTP. Try again.'], 422);

        $record->update(['used' => true]);
        User::where('email', $request->email)->update(['is_email_verified' => true]);

        return response()->json(['message' => 'Email verified! You can now login.']);
    }

    public function resendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();
        if ($user->is_email_verified) {
            return response()->json(['message' => 'Email already verified.'], 422);
        }

        $otp  = OtpVerification::generate($request->email);
        $sent = false;
        try {
            $this->sendOtpMail($request->email, $user->name, $otp->otp);
            $sent = true;
        } catch (\Exception $e) {
            \Log::warning('Mail failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'New OTP sent.',
            'dev_otp' => (!$sent && config('app.debug')) ? $otp->otp : null,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$user->is_email_verified) {
            $otp  = OtpVerification::generate($request->email);
            $sent = false;
            try {
                $this->sendOtpMail($request->email, $user->name, $otp->otp);
                $sent = true;
            } catch (\Exception $e) {}

            return response()->json([
                'message'         => 'Email not verified. OTP sent.',
                'requires_verify' => true,
                'email'           => $request->email,
                'dev_otp'         => (!$sent && config('app.debug')) ? $otp->otp : null,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login Successful',
            'token'   => $token,
            'user'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'roll_number' => $user->roll_number,
                'department'  => $user->department,
                'role'        => $user->role,
                'avatar'      => $user->avatar,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    private function sendOtpMail(string $email, string $name, string $otp): void
    {
        Mail::send([], [], function ($mail) use ($email, $name, $otp) {
            $mail->to($email)
                 ->subject('BookXchange — Your OTP Code')
                 ->html("
                    <div style='font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;'>
                        <h1 style='color:#1a1a2e;text-align:center;'>📚 BookXchange</h1>
                        <p style='color:#555;'>Hi <strong>{$name}</strong>,</p>
                        <p style='color:#555;'>Your verification OTP is:</p>
                        <div style='text-align:center;margin:28px 0;'>
                            <span style='font-size:2.8rem;font-weight:800;letter-spacing:0.6rem;color:#1a1a2e;background:#e8f4fd;padding:18px 36px;border-radius:12px;display:inline-block;'>{$otp}</span>
                        </div>
                        <p style='color:#888;font-size:0.9rem;text-align:center;'>⏰ Valid for <strong>10 minutes</strong>.</p>
                        <p style='color:#bbb;font-size:0.8rem;text-align:center;'>If you did not register, ignore this email.</p>
                    </div>
                ");
        });
    }
}
