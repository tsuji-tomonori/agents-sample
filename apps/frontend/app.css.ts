import { style } from '@vanilla-extract/css';

export const shell = style({
  display: 'grid',
  gridTemplateColumns: '300px minmax(0, 1fr)',
  minHeight: '100vh',
  background: '#f5f6f8',
  '@media': {
    '(max-width: 780px)': {
      gridTemplateColumns: '1fr'
    }
  }
});

export const sidebar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: '100vh',
  padding: 20,
  borderRight: '1px solid #d9dee7',
  background: '#ffffff',
  '@media': {
    '(max-width: 780px)': {
      minHeight: 'auto',
      borderRight: 0,
      borderBottom: '1px solid #d9dee7'
    }
  }
});

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12
});

export const brandMark = style({
  display: 'grid',
  placeItems: 'center',
  width: 38,
  height: 38,
  borderRadius: 8,
  color: '#ffffff',
  background: '#135d54'
});

export const brandTitle = style({
  fontSize: 16,
  fontWeight: 720
});

export const brandMeta = style({
  marginTop: 2,
  color: '#667085',
  fontSize: 12
});

export const newButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 40,
  border: 0,
  borderRadius: 8,
  color: '#ffffff',
  background: '#135d54',
  cursor: 'pointer',
  ':hover': {
    background: '#0f4d46'
  }
});

export const conversationList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  overflowY: 'auto'
});

export const conversationItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  width: '100%',
  minHeight: 58,
  padding: '10px 12px',
  border: '1px solid #d9dee7',
  borderRadius: 8,
  background: '#ffffff',
  color: '#172033',
  textAlign: 'left',
  cursor: 'pointer',
  ':hover': {
    borderColor: '#91a4b7',
    background: '#f7faf9'
  }
});

export const conversationItemActive = style({
  borderColor: '#135d54',
  background: '#e8f3f0'
});

export const conversationTitle = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 14,
  fontWeight: 650
});

export const conversationDate = style({
  color: '#667085',
  fontSize: 11
});

export const chatPanel = style({
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  minHeight: '100vh'
});

export const chatHeader = style({
  padding: '20px 28px',
  borderBottom: '1px solid #d9dee7',
  background: '#ffffff'
});

export const heading = style({
  margin: 0,
  fontSize: 20,
  lineHeight: 1.25,
  fontWeight: 760
});

export const subheading = style({
  margin: '6px 0 0',
  color: '#667085',
  fontSize: 13
});

export const messages = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  overflowY: 'auto',
  padding: '24px 28px'
});

export const emptyState = style({
  display: 'grid',
  placeItems: 'center',
  gap: 10,
  height: '100%',
  color: '#667085',
  textAlign: 'center'
});

export const messageRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  width: '100%',
  maxWidth: 860
});

export const messageRowUser = style({
  alignSelf: 'flex-end',
  flexDirection: 'row-reverse'
});

export const avatar = style({
  display: 'grid',
  placeItems: 'center',
  flex: '0 0 auto',
  width: 34,
  height: 34,
  borderRadius: 8,
  color: '#135d54',
  background: '#ffffff',
  border: '1px solid #d9dee7'
});

export const bubble = style({
  minWidth: 0,
  maxWidth: 'calc(100% - 44px)',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'normal',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: 15,
  lineHeight: 1.65,
  boxShadow: '0 1px 2px rgba(23, 32, 51, 0.06)'
});

export const userBubble = style({
  color: '#ffffff',
  background: '#135d54'
});

export const assistantBubble = style({
  color: '#172033',
  background: '#ffffff',
  border: '1px solid #d9dee7'
});

export const composer = style({
  padding: '16px 28px 22px',
  borderTop: '1px solid #d9dee7',
  background: '#ffffff'
});

export const composerBox = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 42px',
  gap: 10,
  alignItems: 'end'
});

export const textarea = style({
  width: '100%',
  minHeight: 76,
  maxHeight: 180,
  resize: 'vertical',
  border: '1px solid #c9d1dd',
  borderRadius: 8,
  padding: '12px 14px',
  color: '#172033',
  background: '#ffffff',
  outline: 'none',
  ':focus': {
    borderColor: '#135d54',
    boxShadow: '0 0 0 3px rgba(19, 93, 84, 0.16)'
  }
});

export const sendButton = style({
  display: 'grid',
  placeItems: 'center',
  width: 42,
  height: 42,
  border: 0,
  borderRadius: 8,
  color: '#ffffff',
  background: '#135d54',
  cursor: 'pointer',
  ':disabled': {
    cursor: 'not-allowed',
    background: '#9aa6b2'
  },
  selectors: {
    '&:not(:disabled):hover': {
      background: '#0f4d46'
    }
  }
});

export const error = style({
  margin: '0 0 10px',
  color: '#b42318',
  fontSize: 13
});
