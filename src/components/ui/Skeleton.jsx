import PropTypes from 'prop-types';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`skeleton ${className}`}
      {...props}
    />
  );
};

Skeleton.propTypes = {
  className: PropTypes.string,
};

// Preset skeleton variants
const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string,
};

const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />
  );
};

SkeletonAvatar.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

const SkeletonImage = ({ aspectRatio = '16/9', className = '' }) => {
  const aspectClasses = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/4': 'aspect-[3/4]',
    '9/16': 'aspect-[9/16]',
  };

  return (
    <Skeleton
      className={`w-full ${aspectClasses[aspectRatio] || 'aspect-video'} rounded-xl ${className}`}
    />
  );
};

SkeletonImage.propTypes = {
  aspectRatio: PropTypes.oneOf(['1/1', '4/3', '16/9', '3/4', '9/16']),
  className: PropTypes.string,
};

const SkeletonCard = ({ hasImage = true, lines = 3, className = '' }) => {
  return (
    <div className={`surface-elevated p-4 space-y-4 ${className}`}>
      {hasImage && <SkeletonImage aspectRatio="16/9" />}
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
};

SkeletonCard.propTypes = {
  hasImage: PropTypes.bool,
  lines: PropTypes.number,
  className: PropTypes.string,
};

const SkeletonButton = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-28',
  };

  return (
    <Skeleton className={`rounded-xl ${sizes[size]} ${className}`} />
  );
};

SkeletonButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

// Compound export
Skeleton.Text = SkeletonText;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Image = SkeletonImage;
Skeleton.Card = SkeletonCard;
Skeleton.Button = SkeletonButton;

export default Skeleton;
