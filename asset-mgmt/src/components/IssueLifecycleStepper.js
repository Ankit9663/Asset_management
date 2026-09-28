'use client';

/**
 * IssueLifecycleStepper Component
 * Displays the 6-stage lifecycle progression for infrastructure maintenance:
 * Open -> Pending Approval -> Approved -> In Progress -> Awaiting Verification -> Completed
 */

const STAGES = [
  { key: 'Open', label: 'Reported', icon: '📝' },
  { key: 'Pending Approval', label: 'Estimate Review', icon: '⏳' },
  { key: 'Approved', label: 'Authorized', icon: '✅' },
  { key: 'In Progress', label: 'Execution', icon: '🚧' },
  { key: 'Awaiting Verification', label: 'Verification', icon: '🔍' },
  { key: 'Completed', label: 'Closed', icon: '🏁' },
];

export default function IssueLifecycleStepper({ status = 'Open' }) {
  // Map statuses to stage index
  let currentIndex = 0;
  if (status === 'Pending Approval') currentIndex = 1;
  else if (status === 'Approved') currentIndex = 2;
  else if (status === 'In Progress') currentIndex = 3;
  else if (status === 'Awaiting Verification') currentIndex = 4;
  else if (status === 'Completed') currentIndex = 5;

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        width: '100%',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {/* Background track line */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '30px',
          right: '30px',
          height: '3px',
          background: '#e2e8f0',
          zIndex: 1
        }} />

        {/* Completed progress line */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '30px',
          width: `${(currentIndex / (STAGES.length - 1)) * 92}%`,
          height: '3px',
          background: 'var(--color-primary)',
          zIndex: 2,
          transition: 'width 0.3s ease'
        }} />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          let circleBg = '#ffffff';
          let circleBorder = '#cbd5e1';
          let textColor = 'var(--text-tertiary)';
          let fontWeight = 500;

          if (isCompleted) {
            circleBg = 'var(--color-primary)';
            circleBorder = 'var(--color-primary)';
            textColor = 'var(--text-primary)';
          } else if (isCurrent) {
            circleBg = '#ffffff';
            circleBorder = 'var(--color-primary)';
            textColor = 'var(--color-primary)';
            fontWeight = 700;
          }

          return (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: circleBg,
                border: `3px solid ${circleBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: isCompleted ? '#ffffff' : 'inherit',
                fontWeight: 700,
                boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {isCompleted ? '✓' : (idx + 1)}
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight,
                color: textColor,
                marginTop: '6px',
                whiteSpace: 'nowrap'
              }}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
