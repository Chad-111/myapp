import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Start.scss';
import { RedirectContext } from '../App';
import { setAuthToken } from '../components/utils/auth';
import { ToastContainer, toast } from 'react-toastify';

function Form({ option }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const navigate = useNavigate();
    const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
    const [resetStep, setResetStep] = useState(1);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resendTime, setResendTime] = useState(0);
    const COOLDOWN_SECONDS = 60;
    const formRef = useRef();

    useEffect(() => {
        if (formRef.current) {
            formRef.current.classList.remove('was-validated');
        }
        setUsername('');
        setEmail('');
        setPassword('');
        setRepeatPassword('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetStep(1);
        setResendTime(0);
    }, [option]);

    useEffect(() => {
        const savedTime = localStorage.getItem('resendCooldown');
        if (savedTime) {
            const secondsPassed = Math.floor((Date.now() - parseInt(savedTime, 10)) / 1000);
            if (secondsPassed < COOLDOWN_SECONDS) {
                setResendTime(COOLDOWN_SECONDS - secondsPassed);
            }
        }
    }, []);

    useEffect(() => {
        if (resendTime > 0) {
            const interval = setInterval(() => setResendTime(t => t - 1), 1000);
            return () => clearInterval(interval);
        } else {
            localStorage.removeItem('resendCooldown');
        }
    }, [resendTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (option === 3) return;
        if (!formRef.current.checkValidity()) {
            formRef.current.classList.add('was-validated');
            return;
        }
        if (option === 2 && password !== repeatPassword) {
            toast.error('Passwords do not match');
            return;
        }
        const endpoint = option === 2 ? '/api/signup' : '/api/login';
        const body = option === 2 ? { username, email, password } : { username, password };
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An error occurred');
            if (option === 1 || option === 2) {
                setAuthToken(data.access_token);
                navigate(redirectLocation);
                setRedirectLocation('/dashboard');
            }
            toast.success(data.message || 'Success');
        } catch (error) {
            toast.error(error.message || 'An error occurred. Please try again.');
        }
    };

    const handleSendResetCode = async (event) => {
        event.preventDefault();
        try {
            const res = await fetch('/api/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Reset code sent to your email.");
            setResetStep(2);
            setResendTime(COOLDOWN_SECONDS);
            localStorage.setItem('resendCooldown', Date.now().toString());
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleResendCode = async () => {
        if (resendTime > 0) return;
        await handleSendResetCode(new Event('resend'));
    };

    const handleVerifyCode = async (event) => {
        event.preventDefault();
        try {
            const res = await fetch('/api/verify-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: resetCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Code verified. Please enter new password.");
            setResetStep(3);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePasswordReset = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, new_password: newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Password updated. You can now log in.");
            setResetStep(1);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <>
            <form ref={formRef} className='account-form needs-validation' noValidate onSubmit={handleSubmit}>
                <div className={`account-form-fields animated-drop ${option === 1 ? 'sign-in' : option === 2 ? 'sign-up' : 'forgot'}`}>
                    {(option === 1 || option === 2) && (
                        <>
                            {option === 2 && (
                                <div className="form-group mb-2 drop-item">
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="E-mail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <div className="invalid-feedback">Please enter a valid email.</div>
                                </div>
                            )}
                            <div className="form-group mb-2 drop-item">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <div className="invalid-feedback">Please enter a username.</div>
                            </div>
                            <div className="form-group mb-2 drop-item">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required={option === 1 || option === 2}
                                />
                                <div className="invalid-feedback">Please enter a password.</div>
                            </div>
                            {option === 2 && (
                                <div className="form-group mb-2 drop-item">
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Repeat password"
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                        required
                                    />
                                    <div className="invalid-feedback">Please confirm your password.</div>
                                </div>
                            )}
                        </>
                    )}
                    {option === 3 && (
                        <>
                            {resetStep === 1 && (
                                <>
                                    <div className="form-group mb-2 drop-item">
                                        <input
                                            className="form-control"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button className="btn btn-outline-danger drop-item" type="button" onClick={handleSendResetCode}>Send Code</button>
                                </>
                            )}

                            {resetStep === 2 && (
                                <>
                                    <input
                                        className="form-control mb-2 drop-item"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        required
                                    />
                                    <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                                        Can't find the code?
                                        <br />
                                        Please check your <strong>junk or spam folder</strong>.
                                    </p>

                                    <div className="resend-wrapper">
                                        <span>Didn’t get it?</span>
                                        <button className="resend-btn" onClick={handleResendCode} disabled={resendTime > 0}>
                                            Resend {resendTime > 0 ? `(${resendTime}s)` : ''}
                                        </button>
                                    </div>
                                    <button className="btn btn-outline-primary drop-item" type="button" onClick={handleVerifyCode}>
                                        Verify Code
                                    </button>
                                </>
                            )}

                            {resetStep === 3 && (
                                <>
                                    <input
                                        className="form-control mb-2 drop-item"
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <input
                                        className="form-control mb-2 drop-item"
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button className="btn btn-outline-success drop-item" type="button" onClick={handlePasswordReset}>Reset Password</button>
                                </>
                            )}
                        </>
                    )}
                </div>
                {(option === 1 || option === 2) && (
                    <button className='btn btn-outline-success drop-item' type='submit'>
                        {option === 1 ? 'Sign in' : 'Sign up'}
                    </button>
                )}
            </form>
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar newestOnTop />
        </>
    );
}

function Signup() {
    const [option, setOption] = useState(1);
    return (
        <div className='Signup'>
            <header>
                <div className={`header-headings ${option === 1 ? 'sign-in' : option === 2 ? 'sign-up' : 'forgot'}`}>
                    <span>Sign In</span>
                    <span>Join The Empire</span>
                    <span>Forgot Your Password?</span>
                </div>
            </header>
            <ul className='options'>
                <li className={option === 1 ? 'active' : ''} onClick={() => setOption(1)}>Sign in</li>
                <li className={option === 2 ? 'active' : ''} onClick={() => setOption(2)}>Sign up</li>
                <li className={option === 3 ? 'active' : ''} onClick={() => setOption(3)}>Forgot</li>
            </ul>
            <Form option={option} />
        </div>
    );
}

export default Signup;