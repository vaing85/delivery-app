import React, { forwardRef } from 'react';
import { Button, ButtonProps, IconButton, IconButtonProps } from '@mui/material';
import { useAccessibility } from '@/utils/accessibility';

interface AccessibleButtonProps extends Omit<ButtonProps, 'aria-label'> {
  ariaLabel?: string;
  ariaDescription?: string;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  successText?: string;
  error?: boolean;
  errorText?: string;
}

interface AccessibleIconButtonProps extends Omit<IconButtonProps, 'aria-label'> {
  ariaLabel: string;
  ariaDescription?: string;
  tooltip?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    ariaLabel,
    ariaDescription,
    loading = false,
    loadingText = 'Loading',
    success = false,
    successText = 'Success',
    error = false,
    errorText = 'Error',
    disabled,
    onClick,
    ...props
  }, ref) => {
    const { announce } = useAccessibility();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // Announce state changes
      if (success) {
        announce(successText, 'polite');
      } else if (error) {
        announce(errorText, 'assertive');
      }

      onClick?.(event);
    };

    const getAriaLabel = () => {
      if (ariaLabel) return ariaLabel;
      if (loading) return `${ariaLabel || children} - ${loadingText}`;
      if (success) return `${ariaLabel || children} - ${successText}`;
      if (error) return `${ariaLabel || children} - ${errorText}`;
      return children?.toString() || 'Button';
    };

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={getAriaLabel()}
        aria-describedby={ariaDescription ? `${props.id}-description` : undefined}
        aria-live={success || error ? 'polite' : undefined}
        {...props}
      >
        {loading ? loadingText : children}
        {ariaDescription && (
          <span id={`${props.id}-description`} className="sr-only">
            {ariaDescription}
          </span>
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(
  ({
    children,
    ariaLabel,
    ariaDescription,
    tooltip,
    onClick,
    ...props
  }, ref) => {
    const { announce } = useAccessibility();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      announce(`${ariaLabel} activated`, 'polite');
      onClick?.(event);
    };

    return (
      <IconButton
        ref={ref}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${props.id}-description` : undefined}
        title={tooltip || ariaLabel}
        {...props}
      >
        {children}
        {ariaDescription && (
          <span id={`${props.id}-description`} className="sr-only">
            {ariaDescription}
          </span>
        )}
      </IconButton>
    );
  }
);

AccessibleIconButton.displayName = 'AccessibleIconButton';

// Accessible form button group
interface AccessibleButtonGroupProps {
  buttons: Array<{
    label: string;
    onClick: () => void;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
  }>;
  orientation?: 'horizontal' | 'vertical';
  ariaLabel?: string;
  className?: string;
}

export const AccessibleButtonGroup: React.FC<AccessibleButtonGroupProps> = ({
  buttons,
  orientation = 'horizontal',
  ariaLabel = 'Button group',
  className,
}) => {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: '8px',
      }}
    >
      {buttons.map((button, index) => (
        <AccessibleButton
          key={index}
          variant={button.variant || 'outlined'}
          color={button.color || 'primary'}
          disabled={button.disabled}
          loading={button.loading}
          onClick={button.onClick}
          startIcon={button.icon}
          ariaLabel={button.label}
        >
          {button.label}
        </AccessibleButton>
      ))}
    </div>
  );
};

export default AccessibleButton;
