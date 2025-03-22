import React, { useState } from 'react';
import './Signup.scss';

function Form({ option }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (option === 2 && password !== repeatPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage(data.error);
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <form className='account-form' onSubmit={handleSubmit}>
            <div className={'account-form-fields ' + (option === 1 ? 'sign-in' : (option === 2 ? 'sign-up' : 'forgot'))}>
                {option === 2 && (
                    <input
                        id='username'
                        name='username'
                        type='text'
                        placeholder='Username'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={option === 2}
                    />
                )}
                <input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='E-mail'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    id='password'
                    name='password'
                    type='password'
                    placeholder='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={option === 1 || option === 2}
                    disabled={option === 3}
                />
                {option === 2 && (
                    <input
                        id='repeat-password'
                        name='repeat-password'
                        type='password'
                        placeholder='Repeat password'
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        required={option === 2}
                    />
                )}
            </div>
            <button className='btn-submit-form' type='submit'>
                {option === 1 ? 'Sign in' : (option === 2 ? 'Sign up' : 'Reset password')}
            </button>
            {message && <p>{message}</p>}
        </form>
    );
}

function Signup() {
    const [option, setOption] = useState(1);

    return (
        <div className='Signup'>
            <header>
                <div className={'header-headings ' + (option === 1 ? 'sign-in' : (option === 2 ? 'sign-up' : 'forgot'))}>
                    <span>Sign in to your account</span>
                    <span>Create an account</span>
                    <span>Reset your password</span>
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