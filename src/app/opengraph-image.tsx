import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BAiSED — Principal Engineer // Base L2';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#050508',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'monospace',
        }}
      >
        {/* Top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#0052FF',
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#EDEDED',
            letterSpacing: '-2px',
            display: 'flex',
          }}
        >
          BAiSED
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: '#0052FF',
            marginTop: '12px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          PRINCIPAL_ENGINEER // DEVREL_ORACLE // BASE_L2
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '20px',
            color: '#787878',
            marginTop: '32px',
            lineHeight: 1.6,
            maxWidth: '800px',
            display: 'flex',
          }}
        >
          Live Base ecosystem telemetry, protocol activity, and gated intel.
          No hype. No speculation. Just signal.
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            fontSize: '18px',
            color: '#444444',
            display: 'flex',
          }}
        >
          baised.dev · baisedagent.base.eth
        </div>
      </div>
    ),
    { ...size }
  );
}
