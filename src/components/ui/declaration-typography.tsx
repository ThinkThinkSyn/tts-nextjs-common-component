import { Text, Heading } from '@radix-ui/themes';

export const DeclarationParagraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text as="p" size="3" mb="3" style={{ whiteSpace: 'pre-line' }}>
    {children}
  </Text>
);

export const DeclarationHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Heading as="h3" size="4" mb="2">
    {children}
  </Heading>
);
