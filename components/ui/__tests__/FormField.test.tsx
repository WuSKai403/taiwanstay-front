import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormField from '../FormField';

describe('FormField', () => {
    it('renders label and children correctly', () => {
        render(
            <FormField label="Test Label">
                <input data-testid="test-input" />
            </FormField>
        );

        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('shows required asterisk when required prop is true', () => {
        render(
            <FormField label="Test Label" required>
                <input />
            </FormField>
        );

        expect(screen.getByText('*')).toBeInTheDocument();
        expect(screen.getByText('*')).toHaveClass('text-red-500');
    });

    it('displays helper text when provided', () => {
        render(
            <FormField label="Test Label" helperText="Helper message">
                <input />
            </FormField>
        );

        expect(screen.getByText('Helper message')).toBeInTheDocument();
    });

    it('displays error message when error is provided', () => {
        const error = { message: 'Error message', type: 'required' };
        render(
            <FormField label="Test Label" error={error}>
                <input />
            </FormField>
        );

        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.getByText('Error message')).toHaveClass('text-red-600');
    });

    it('does not display helper text when error is present', () => {
        const error = { message: 'Error message', type: 'required' };
        render(
            <FormField label="Test Label" helperText="Helper message" error={error}>
                <input />
            </FormField>
        );

        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.queryByText('Helper message')).not.toBeInTheDocument();
    });
});
