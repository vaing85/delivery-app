import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import useResponsive from '@/hooks/useResponsive';

interface MobileCardProps {
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  image?: string;
  status?: string;
  statusColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  avatar?: string;
  avatarText?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  onMenuClick?: () => void;
  children?: React.ReactNode;
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  sx?: any;
}

const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  content,
  image,
  status,
  statusColor = 'default',
  avatar,
  avatarText,
  actions,
  onClick,
  onMenuClick,
  children,
  elevation = 1,
  variant = 'elevation',
  sx = {},
}) => {
  const theme = useTheme();
  const { isMobile, touchDevice } = useResponsive();

  const cardStyles = {
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    '&:hover': onClick ? {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    } : {},
    '&:active': onClick && touchDevice ? {
      transform: 'translateY(0px)',
      boxShadow: theme.shadows[2],
    } : {},
    ...sx,
  };

  return (
    <Card
      elevation={elevation}
      variant={variant}
      onClick={onClick}
      sx={cardStyles}
    >
      {/* Image */}
      {image && (
        <CardMedia
          component="img"
          height={isMobile ? 140 : 160}
          image={image}
          alt={title}
          sx={{
            objectFit: 'cover',
          }}
        />
      )}

      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        {/* Header with Avatar and Menu */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" flexGrow={1}>
            {avatar && (
              <Avatar
                src={avatar}
                sx={{
                  width: isMobile ? 32 : 40,
                  height: isMobile ? 32 : 40,
                  mr: 1.5,
                }}
              >
                {avatarText}
              </Avatar>
            )}
            <Box flexGrow={1}>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                component="h3"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.3,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          
          {onMenuClick && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick();
              }}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Status Chip */}
        {status && (
          <Box mb={1.5}>
            <Chip
              label={status}
              color={statusColor}
              size="small"
              sx={{
                fontSize: '0.75rem',
                height: 20,
              }}
            />
          </Box>
        )}

        {/* Content */}
        {content && (
          <Box mb={1.5}>
            {content}
          </Box>
        )}

        {/* Children */}
        {children && (
          <Box>
            {children}
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      {actions && (
        <>
          <Divider />
          <CardActions sx={{ p: isMobile ? 1.5 : 2, pt: 1.5 }}>
            {actions}
          </CardActions>
        </>
      )}
    </Card>
  );
};

// Mobile-specific list item component
interface MobileListItemProps {
  primary: string;
  secondary?: string;
  avatar?: string;
  avatarText?: string;
  icon?: React.ReactNode;
  status?: string;
  statusColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onClick?: () => void;
  rightAction?: React.ReactNode;
  sx?: any;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  primary,
  secondary,
  avatar,
  avatarText,
  icon,
  status,
  statusColor = 'default',
  onClick,
  rightAction,
  sx = {},
}) => {
  const { isMobile } = useResponsive();

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        mb: 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          bgcolor: 'action.hover',
        } : {},
        ...sx,
      }}
    >
      <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
        <Box display="flex" alignItems="center">
          {/* Left side - Avatar/Icon */}
          <Box mr={1.5}>
            {avatar ? (
              <Avatar
                src={avatar}
                sx={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                }}
              >
                {avatarText}
              </Avatar>
            ) : icon ? (
              <Box
                sx={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.light',
                  borderRadius: '50%',
                  color: 'primary.contrastText',
                }}
              >
                {icon}
              </Box>
            ) : null}
          </Box>

          {/* Center - Text content */}
          <Box flexGrow={1} minWidth={0}>
            <Typography
              variant={isMobile ? 'subtitle2' : 'subtitle1'}
              sx={{
                fontWeight: 500,
                lineHeight: 1.2,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {primary}
            </Typography>
            {secondary && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {secondary}
              </Typography>
            )}
            {status && (
              <Box mt={0.5}>
                <Chip
                  label={status}
                  color={statusColor}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: 18,
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Right side - Action */}
          {rightAction && (
            <Box ml={1}>
              {rightAction}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MobileCard;
