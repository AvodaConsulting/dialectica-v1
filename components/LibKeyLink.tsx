import React from 'react';
import LibraryIcon from './icons/LibraryIcon';
import type { Institution } from '../types';

interface LibKeyLinkProps {
    doi: string;
    institution: Institution;
    variant?: 'button' | 'icon';
}

const LibKeyLink: React.FC<LibKeyLinkProps> = ({ doi, institution, variant = 'button' }) => {
    if (!doi) return null;
    const libkeyUrl = `https://libkey.io/libraries/${institution.id}/find?doi=${encodeURIComponent(doi.trim())}`;

    if (variant === 'icon') {
      return (
        <a href={libkeyUrl} target="_blank" rel="noopener noreferrer" title={`Access full text via ${institution.name}`} className="p-1 rounded-full text-content-200 hover:text-brand-primary">
          <LibraryIcon className="w-5 h-5" />
        </a>
      );
    }

    return (
      <a href={libkeyUrl} target="_blank" rel="noopener noreferrer" className="text-sm bg-brand-secondary/20 text-brand-secondary font-semibold py-1 px-2 rounded-md hover:bg-brand-secondary/30 transition-colors">
        Get Full Text
      </a>
    );
};
export default LibKeyLink;
