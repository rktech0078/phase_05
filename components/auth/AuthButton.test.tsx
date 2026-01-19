import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthButton } from './AuthButton';

// Mock the auth client and router
const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
const mockPush = vi.fn();

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => mockUseSession(),
        signOut: () => mockSignOut(),
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

describe('AuthButton', () => {
    it('renders Sign In button when not authenticated', () => {
        mockUseSession.mockReturnValue({
            data: null,
            isPending: false,
            error: null,
        });

        render(<AuthButton />);
        const button = screen.getByText('Sign In');
        expect(button).toBeDefined();

        fireEvent.click(button);
        expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });

    it('renders Sign Out button when authenticated', () => {
        mockUseSession.mockReturnValue({
            data: { session: { user: { name: 'Test User' } } },
            isPending: false,
            error: null,
        });

        render(<AuthButton />);
        const button = screen.getByText('Sign Out');
        expect(button).toBeDefined();
    });

    it('calls signOut when Sign Out button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: { session: { user: { name: 'Test User' } } },
            isPending: false,
            error: null,
        });

        mockSignOut.mockResolvedValue({ error: null });

        render(<AuthButton />);
        const button = screen.getByText('Sign Out');

        fireEvent.click(button);
        expect(mockSignOut).toHaveBeenCalled();
    });
});
