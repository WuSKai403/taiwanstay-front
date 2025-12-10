import React, { useState } from 'react';
import FormField from '../ui/FormField';

interface LoginFormProps {
    onSubmit: (data: { email: string; password: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit({ email, password });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Login</h2>

            <FormField label="Email" error={errors.email} required htmlFor="email">
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter your email"
                />
            </FormField>

            <FormField label="Password" error={errors.password} required htmlFor="password">
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter your password"
                />
            </FormField>

            <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
                Sign In
            </button>
        </form>
    );
};

export default LoginForm;
