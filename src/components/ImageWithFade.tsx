import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface ImageWithFadeProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export const ImageWithFade = ({ src, alt, className, wrapperClassName, ...props }: ImageWithFadeProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative", wrapperClassName)}>
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
};
