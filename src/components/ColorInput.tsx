import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface ColorInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

const PREDEFINED_COLORS = [
    "Amarelo",
    "Azul",
    "Azul Marinho",
    "Branco",
    "Cinza",
    "Listrados Azul",
    "Listrados Azul Marinho",
    "Preto",
    "Rosa",
    "Verde",
    "Vermelho",
    "Vinho",
    "Off-White",
    "Bege"
];

export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, placeholder, className, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredColors, setFilteredColors] = useState(PREDEFINED_COLORS);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter colors based on input
    useEffect(() => {
        if (!value) {
            setFilteredColors(PREDEFINED_COLORS);
        } else {
            const lowerValue = value.toLowerCase();
            const filtered = PREDEFINED_COLORS.filter(c =>
                c.toLowerCase().includes(lowerValue)
            );
            // Always show all options if the filtered list is empty or if user is just clicking arrow
            // But here we want to offer suggestions. If strict match, maybe show others?
            // Let's keep it simple: show matches.
            setFilteredColors(filtered.length > 0 ? filtered : PREDEFINED_COLORS);
        }
    }, [value]);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (color: string) => {
        onChange(color);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    required={required}
                    className={`${className} pr-8`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-nexus-cyan transition-colors"
                >
                    <ChevronDown size={16} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => handleSelect(color)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between group transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full border border-slate-600"
                                    style={{
                                        backgroundColor: color.toLowerCase().includes('listrado') ? 'transparent' : color.toLowerCase().replace(' ', ''),
                                        background: color.toLowerCase().includes('listrado') ? 'repeating-linear-gradient(45deg, #60a5fa, #60a5fa 2px, transparent 2px, transparent 4px)' : undefined
                                    }}
                                ></span>
                                {color}
                            </span>
                            {value === color && <Check size={14} className="text-nexus-cyan" />}
                        </button>
                    ))}
                    {filteredColors.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-500 italic">
                            Nenhuma sugestão encontrada.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
