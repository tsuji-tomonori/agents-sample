import { keyframes, style } from '@vanilla-extract/css';

const focusRing = {
  outline: '3px solid rgba(16, 112, 202, 0.36)',
  outlineOffset: 2
};

const spin = keyframes({
  to: {
    transform: 'rotate(360deg)'
  }
});

export const shell = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(340px, 440px) minmax(0, 1fr)',
  minHeight: '100vh',
  color: '#172033',
  background: '#eef2f6',
  '@media': {
    '(max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  }
});

export const consolePanel = style({
  display: 'grid',
  alignContent: 'start',
  gap: 20,
  minHeight: '100vh',
  padding: 24,
  borderRight: '1px solid #cbd5e1',
  background: '#ffffff',
  '@media': {
    '(max-width: 900px)': {
      minHeight: 'auto',
      borderRight: 0,
      borderBottom: '1px solid #cbd5e1'
    },
    '(max-width: 480px)': {
      padding: 16
    }
  }
});

export const hero = style({
  display: 'grid',
  gap: 14
});

export const brandRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0
});

export const brandMark = style({
  display: 'grid',
  placeItems: 'center',
  flex: '0 0 auto',
  width: 44,
  height: 44,
  borderRadius: 8,
  color: '#ffffff',
  background: '#123b6d'
});

export const eyebrow = style({
  margin: 0,
  color: '#526070',
  fontSize: 12,
  fontWeight: 760,
  letterSpacing: 0,
  textTransform: 'uppercase'
});

export const heading = style({
  margin: 0,
  fontSize: 32,
  lineHeight: 1.1,
  fontWeight: 780,
  letterSpacing: 0,
  '@media': {
    '(max-width: 480px)': {
      fontSize: 28
    }
  }
});

export const subheading = style({
  margin: 0,
  maxWidth: 620,
  color: '#526070',
  fontSize: 14,
  lineHeight: 1.6
});

export const runForm = style({
  display: 'grid',
  gap: 16
});

export const fieldGroup = style({
  display: 'grid',
  gap: 8
});

export const label = style({
  color: '#233044',
  fontSize: 14,
  fontWeight: 720
});

export const questionInput = style({
  width: '100%',
  minHeight: 176,
  maxHeight: 360,
  resize: 'vertical',
  border: '1px solid #b9c4d0',
  borderRadius: 8,
  padding: '13px 14px',
  color: '#172033',
  background: '#ffffff',
  font: 'inherit',
  lineHeight: 1.55,
  outline: 'none',
  selectors: {
    '&:focus-visible': focusRing
  }
});

export const scopeInput = style({
  width: '100%',
  minHeight: 44,
  border: '1px solid #b9c4d0',
  borderRadius: 8,
  padding: '0 13px',
  color: '#172033',
  background: '#ffffff',
  font: 'inherit',
  outline: 'none',
  selectors: {
    '&:focus-visible': focusRing
  }
});

export const helpText = style({
  margin: 0,
  color: '#526070',
  fontSize: 13,
  lineHeight: 1.5
});

export const error = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  margin: 0,
  padding: '10px 12px',
  border: '1px solid #f2b8b5',
  borderRadius: 8,
  color: '#8d1f16',
  background: '#fff4f2',
  fontSize: 14,
  lineHeight: 1.45
});

export const actionRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap'
});

const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minWidth: 96,
  minHeight: 44,
  borderRadius: 8,
  padding: '0 16px',
  font: 'inherit',
  fontWeight: 720,
  cursor: 'pointer',
  selectors: {
    '&:focus-visible': focusRing,
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.62
    }
  }
});

export const primaryButton = style([
  buttonBase,
  {
    border: 0,
    color: '#ffffff',
    background: '#0f766e',
    selectors: {
      '&:not(:disabled):hover': {
        background: '#115e59'
      }
    }
  }
]);

export const secondaryButton = style([
  buttonBase,
  {
    border: '1px solid #b9c4d0',
    color: '#233044',
    background: '#ffffff',
    selectors: {
      '&:not(:disabled):hover': {
        background: '#f4f7fa'
      }
    }
  }
]);

export const spinIcon = style({
  animation: `${spin} 1s linear infinite`
});

export const resultsPanel = style({
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: 18,
  minHeight: '100vh',
  padding: 24,
  outline: 'none',
  '@media': {
    '(max-width: 900px)': {
      minHeight: 'auto'
    },
    '(max-width: 480px)': {
      padding: 16
    }
  }
});

export const resultsHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  minWidth: 0,
  '@media': {
    '(max-width: 520px)': {
      alignItems: 'flex-start',
      flexDirection: 'column'
    }
  }
});

export const sectionTitle = style({
  margin: '3px 0 0',
  overflowWrap: 'anywhere',
  color: '#172033',
  fontSize: 22,
  lineHeight: 1.25,
  fontWeight: 760,
  letterSpacing: 0
});

export const statusPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  minHeight: 32,
  borderRadius: 999,
  padding: '0 12px',
  border: '1px solid transparent',
  fontSize: 13,
  fontWeight: 760,
  whiteSpace: 'nowrap'
});

export const statusNeutral = style({
  color: '#3f4b5b',
  borderColor: '#cbd5e1',
  background: '#ffffff'
});

export const statusActive = style({
  color: '#144b77',
  borderColor: '#9bc2e6',
  background: '#eaf5ff'
});

export const statusSuccess = style({
  color: '#166534',
  borderColor: '#9fd3ad',
  background: '#eefbf1'
});

export const statusError = style({
  color: '#8d1f16',
  borderColor: '#f2b8b5',
  background: '#fff4f2'
});

export const emptyState = style({
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  gap: 12,
  minHeight: 360,
  padding: 28,
  border: '1px dashed #b9c4d0',
  borderRadius: 8,
  color: '#526070',
  background: '#ffffff',
  textAlign: 'center',
  lineHeight: 1.6
});

export const resultGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)',
  gap: 16,
  alignItems: 'start',
  '@media': {
    '(max-width: 1180px)': {
      gridTemplateColumns: '1fr'
    }
  }
});

const panelBase = style({
  minWidth: 0,
  border: '1px solid #d8e0e8',
  borderRadius: 8,
  background: '#ffffff',
  boxShadow: '0 1px 2px rgba(23, 32, 51, 0.05)'
});

export const answerPanel = style([
  panelBase,
  {
    padding: 18,
    gridColumn: '1 / 2',
    '@media': {
      '(max-width: 1180px)': {
        gridColumn: 'auto'
      }
    }
  }
]);

export const timelinePanel = style([
  panelBase,
  {
    padding: 18,
    gridColumn: '2 / 3',
    gridRow: '1 / 3',
    '@media': {
      '(max-width: 1180px)': {
        gridColumn: 'auto',
        gridRow: 'auto'
      }
    }
  }
]);

export const evidencePanel = style([
  panelBase,
  {
    padding: 18
  }
]);

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  marginBottom: 12,
  color: '#123b6d'
});

export const cardTitle = style({
  margin: 0,
  color: '#172033',
  fontSize: 16,
  lineHeight: 1.3,
  fontWeight: 760,
  letterSpacing: 0
});

export const answerText = style({
  margin: 0,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  color: '#172033',
  fontSize: 15,
  lineHeight: 1.75
});

export const mutedText = style({
  margin: 0,
  color: '#526070',
  fontSize: 14,
  lineHeight: 1.6
});

export const timelineList = style({
  display: 'grid',
  gap: 14,
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const timelineItem = style({
  display: 'grid',
  gridTemplateColumns: '14px minmax(0, 1fr)',
  gap: 10,
  alignItems: 'start'
});

export const timelineDot = style({
  width: 10,
  height: 10,
  marginTop: 5,
  borderRadius: 999,
  background: '#0f766e',
  boxShadow: '0 0 0 4px rgba(15, 118, 110, 0.14)'
});

export const timelineTopline = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  color: '#233044',
  fontSize: 14,
  fontWeight: 720,
  lineHeight: 1.35,
  '@media': {
    '(max-width: 420px)': {
      flexDirection: 'column',
      gap: 2
    }
  }
});

export const timelineTime = style({
  flex: '0 0 auto',
  color: '#526070',
  fontSize: 12,
  fontWeight: 520
});

export const timelineDetail = style({
  margin: '4px 0 0',
  color: '#526070',
  fontSize: 13,
  lineHeight: 1.5,
  overflowWrap: 'anywhere'
});

export const itemList = style({
  display: 'grid',
  gap: 10,
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const listItem = style({
  display: 'grid',
  gap: 4,
  minWidth: 0,
  padding: '10px 12px',
  border: '1px solid #e1e7ef',
  borderRadius: 8,
  background: '#f8fafc'
});

export const itemTitle = style({
  color: '#123b6d',
  fontSize: 14,
  fontWeight: 760,
  lineHeight: 1.4,
  overflowWrap: 'anywhere',
  selectors: {
    '&:focus-visible': focusRing
  }
});

export const itemMeta = style({
  color: '#526070',
  fontSize: 12,
  lineHeight: 1.4,
  overflowWrap: 'anywhere'
});

export const itemBody = style({
  margin: 0,
  color: '#233044',
  fontSize: 13,
  lineHeight: 1.55,
  overflowWrap: 'anywhere'
});
