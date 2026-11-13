import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface ReviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !comment) {
      setErrorMsg('Please enter both title and comment');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.submitReview({
        productId: product.id,
        userId: user?.id || 'usr-guest',
        userName: user?.name || 'Andhra Customer',
        userDistrict: user?.addresses?.[0]?.district || 'Vijayawada, AP',
        rating,
        title,
        comment
      });
      setLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg('Failed to submit review');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Failed to submit review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-1">Write a Review</h3>
        <p className="text-xs text-slate-500 mb-4 line-clamp-1">Reviewing: {product.title}</p>

        {errorMsg && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Your Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition"
                >
                  <Star className={`w-6 h-6 ${rating >= star ? 'fill-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
              <span className="ml-2 font-bold text-slate-800 text-sm">{rating} / 5 Stars</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Headline / Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Authentic Godavari taste, very fresh!"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Your Detailed Experience</label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell other shoppers in Andhra Pradesh about the quality, packaging, delivery speed, and taste..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
