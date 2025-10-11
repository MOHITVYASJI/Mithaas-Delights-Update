import React, { useState, useEffect } from 'react';
import './StarRatingAnimation.css';

export const StarRatingAnimation = ({ 
  initialRating = 0, 
  onRatingChange, 
  readonly = false,
  size = 'md' // sm, md, lg
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);

  const ratings = [
    { id: 1, name: "Terrible" },
    { id: 2, name: "Bad" },
    { id: 3, name: "OK" },
    { id: 4, name: "Good" },
    { id: 5, name: "Excellent" }
  ];

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleRatingChange = (value) => {
    if (readonly) return;
    setRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  const sizeClasses = {
    sm: 'star-rating--sm',
    md: 'star-rating--md',
    lg: 'star-rating--lg'
  };

  return (
    <div className={`star-rating ${sizeClasses[size]} ${readonly ? 'star-rating--readonly' : ''}`}>
      <div className="star-rating__stars">
        {ratings.map((ratingItem, index) => (
          <label
            key={ratingItem.id}
            className={`star-rating__label ${index < rating ? 'star-rating__label--active' : ''} ${index > 0 && index < rating ? `star-rating__label--delay${Math.min(index, 4)}` : ''}`}
            htmlFor={readonly ? undefined : `rating-${ratingItem.id}`}
            onMouseEnter={() => !readonly && setHoveredRating(ratingItem.id)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
          >
            <input
              id={readonly ? undefined : `rating-${ratingItem.id}`}
              className="star-rating__input"
              type="radio"
              name="rating"
              value={ratingItem.id}
              checked={rating === ratingItem.id}
              onChange={(e) => handleRatingChange(parseInt(e.target.value))}
              disabled={readonly}
            />
            <svg className="star-rating__star" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <g transform="translate(16,16)">
                <circle 
                  className="star-rating__star-ring" 
                  fill="none" 
                  stroke="#f4a825" 
                  strokeWidth="16" 
                  r="8" 
                  transform="scale(0)" 
                />
              </g>
              <g stroke="#f4a825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <g transform="translate(16,16) rotate(180)">
                  <polygon 
                    className="star-rating__star-stroke" 
                    points="0,15 4.41,6.07 14.27,4.64 7.13,-2.32 8.82,-12.14 0,-7.5 -8.82,-12.14 -7.13,-2.32 -14.27,4.64 -4.41,6.07" 
                    fill="none" 
                  />
                  <polygon 
                    className="star-rating__star-fill" 
                    points="0,15 4.41,6.07 14.27,4.64 7.13,-2.32 8.82,-12.14 0,-7.5 -8.82,-12.14 -7.13,-2.32 -14.27,4.64 -4.41,6.07" 
                    fill="#f4a825" 
                  />
                </g>
                <g transform="translate(16,16)" strokeDasharray="12 12" strokeDashoffset="12">
                  <polyline className="star-rating__star-line" transform="rotate(0)" points="0 4,0 16" />
                  <polyline className="star-rating__star-line" transform="rotate(72)" points="0 4,0 16" />
                  <polyline className="star-rating__star-line" transform="rotate(144)" points="0 4,0 16" />
                  <polyline className="star-rating__star-line" transform="rotate(216)" points="0 4,0 16" />
                  <polyline className="star-rating__star-line" transform="rotate(288)" points="0 4,0 16" />
                </g>
              </g>
            </svg>
            <span className="star-rating__sr">{ratingItem.name}</span>
          </label>
        ))}
      </div>
      {!readonly && (
        <p className="star-rating__display">
          {(hoveredRating || rating) ? ratings[hoveredRating - 1 || rating - 1]?.name : 'Select a rating'}
        </p>
      )}
    </div>
  );
};

export default StarRatingAnimation;
