import React from 'react';

interface DisagreementMeterProps {
    score: number;
    label: string;
}

const DisagreementMeter: React.FC<DisagreementMeterProps> = ({ score, label }) => {
    const percentage = (score / 10) * 100;
    const getColor = () => {
      if (score <= 3) return 'bg-green-500';
      if (score <= 7) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="w-full max-w-sm text-center">
        <h3 className="text-lg font-semibold text-content-100 mb-2">Disagreement Level</h3>
        <div className="relative h-4 w-full bg-base-300 rounded-full overflow-hidden">
          <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getColor()}`} style={{ width: `${percentage}%` }}/>
        </div>
        <p className="mt-2 text-content-200 font-medium">{label} ({score}/10)</p>
      </div>
    );
};
export default DisagreementMeter;
