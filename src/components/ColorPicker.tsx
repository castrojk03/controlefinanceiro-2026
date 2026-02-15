import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus } from 'lucide-react';

const PRESET_COLORS = [
    { name: 'Vermelho', value: 'hsl(0, 84%, 60%)' },
    { name: 'Laranja', value: 'hsl(30, 80%, 55%)' },
    { name: 'Amarelo', value: 'hsl(45, 80%, 50%)' },
    { name: 'Verde', value: 'hsl(140, 70%, 45%)' },
    { name: 'Azul', value: 'hsl(210, 80%, 55%)' },
    { name: 'Roxo', value: 'hsl(280, 70%, 55%)' },
    { name: 'Rosa', value: 'hsl(340, 70%, 55%)' },
];

// Convert HSL string to hex for the color input
function hslStringToHex(hsl: string): string {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return hsl.startsWith('#') ? hsl : '#3b82f6';

    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
}

export function ColorPicker({ value, onChange, label = 'Cor' }: ColorPickerProps) {
    const [customOpen, setCustomOpen] = useState(false);
    const [hexInput, setHexInput] = useState('');

    const isPresetColor = PRESET_COLORS.some(c => c.value === value);
    const displayHex = hslStringToHex(value);

    const handleHexSubmit = () => {
        const hex = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onChange(hex);
            setHexInput('');
            setCustomOpen(false);
        }
    };

    const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                {/* Preset colors */}
                <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            className={`h-7 w-7 rounded-md border-2 transition-all hover:scale-110 ${value === color.value
                                    ? 'border-foreground ring-2 ring-foreground/20 scale-110'
                                    : 'border-border'
                                }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => onChange(color.value)}
                            title={color.name}
                        />
                    ))}

                    {/* Custom color indicator (shown when a non-preset color is selected) */}
                    {!isPresetColor && value && (
                        <div
                            className="h-7 w-7 rounded-md border-2 border-foreground ring-2 ring-foreground/20 scale-110"
                            style={{ backgroundColor: value }}
                            title="Cor personalizada"
                        />
                    )}

                    {/* Add custom color button */}
                    <Popover open={customOpen} onOpenChange={setCustomOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="h-7 w-7 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center hover:border-foreground hover:bg-accent transition-all"
                                title="Adicionar cor personalizada"
                            >
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 space-y-3" align="start">
                            <h4 className="font-medium text-sm">Cor Personalizada</h4>

                            {/* Native color picker (works as eyedropper in Chrome/Edge) */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs">Selecionar visualmente</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={displayHex}
                                        onChange={handleColorPickerChange}
                                        className="h-9 w-14 cursor-pointer rounded border-2 border-border p-0.5"
                                        title="Conta-gotas / Seletor de cor"
                                    />
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {displayHex}
                                    </span>
                                </div>
                            </div>

                            {/* Hex code input */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs">Código Hex</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="#FF5733"
                                        value={hexInput}
                                        onChange={(e) => setHexInput(e.target.value)}
                                        className="border-2 text-sm font-mono h-8"
                                        maxLength={7}
                                        onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleHexSubmit}
                                        className="h-8 px-3 text-xs"
                                    >
                                        OK
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
