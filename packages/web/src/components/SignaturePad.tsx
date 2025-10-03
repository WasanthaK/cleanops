import { useEffect, useRef } from 'react';

interface Props {
  onChange: (dataUrl: string) => void;
}

export default function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0a1f44';
    ctx.lineWidth = 3;

    const start = (event: PointerEvent) => {
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(event.offsetX, event.offsetY);
    };

    const draw = (event: PointerEvent) => {
      if (!drawing.current) return;
      ctx.lineTo(event.offsetX, event.offsetY);
      ctx.stroke();
      onChange(canvas.toDataURL('image/png'));
    };

    const end = () => {
      drawing.current = false;
    };

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', end);

    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', draw);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointerleave', end);
    };
  }, [onChange]);

  return <canvas ref={canvasRef} width={320} height={160} style={{ border: '1px solid #0a1f44' }} />;
}
