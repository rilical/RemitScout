import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  UnorderedList,
  ListItem,
  Divider,
  useColorModeValue,
  Code,
} from '@chakra-ui/react';

function PrivacyPolicy() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('#00659D', '#00b4d8');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Box bg={bgColor} minH="100vh" py={16}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center" mb={8}>
            <Heading as="h1" size="2xl" color={headingColor} mb={4}>
              Privacy Policy
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Effective Date: {formattedDate}
            </Text>
          </Box>

          <Text color={textColor}>
            Thank you for choosing <strong>RemitScout</strong> ("the Service," "we," "us," "our"). 
            Your privacy is important to us, and this Privacy Policy outlines the types of information 
            we collect from you, how we use and protect it, and the circumstances in which we may 
            share or disclose it.
          </Text>

          {/* Introduction */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              1. Introduction
            </Heading>
            <UnorderedList spacing={2} pl={4} mb={4}>
              <ListItem>RemitScout offers an online platform that allows users to compare international money transfer options and fees.</ListItem>
              <ListItem>By using our website or services, you agree to the collection and use of your information in accordance with this Privacy Policy.</ListItem>
            </UnorderedList>
          </Box>

          {/* Information We Collect */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              2. Information We Collect
            </Heading>
            <Text mb={4}>We may collect two main categories of information:</Text>
            
            <Heading as="h3" size="md" mb={2}>Personal Information:</Heading>
            <UnorderedList spacing={2} pl={4} mb={4}>
              <ListItem><strong>Contact Data</strong>: Such as name, email address, phone number (if you create an account or subscribe to our newsletter).</ListItem>
              <ListItem><strong>Transaction Data</strong>: If you interact with certain features (e.g., favorite providers), we may collect basic information on your preferences or comparison history.</ListItem>
            </UnorderedList>

            <Heading as="h3" size="md" mb={2}>Non-Personal (Technical) Information:</Heading>
            <UnorderedList spacing={2} pl={4} mb={4}>
              <ListItem><strong>Usage Data</strong>: Pages viewed, time spent on site, clicks, and other diagnostic data about how you navigate or use our services.</ListItem>
              <ListItem><strong>Device & Log Data</strong>: IP address, browser type, device identifiers, operating system details, and timestamps.</ListItem>
            </UnorderedList>
          </Box>

          {/* How We Use Your Information */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              3. How We Use Your Information
            </Heading>
            <Text mb={4}>We may use the information we collect for various purposes, including:</Text>
            <UnorderedList spacing={4} pl={4} mb={4}>
              <ListItem>
                <strong>To Provide and Maintain Our Service</strong>
                <Text mt={1}>Ensuring the website runs smoothly, personalizing the comparison results, or fulfilling user requests.</Text>
              </ListItem>
              <ListItem>
                <strong>To Improve User Experience</strong>
                <Text mt={1}>Analyzing usage patterns, troubleshooting technical issues, and refining our platform features.</Text>
              </ListItem>
              <ListItem>
                <strong>To Send Periodic Communications</strong>
                <Text mt={1}>Updating you on new features, relevant remittance news, special promotions, or policy changes (only with your consent or as permitted by law).</Text>
              </ListItem>
              <ListItem>
                <strong>For Security Measures</strong>
                <Text mt={1}>Monitoring and preventing security breaches, enforcing our Terms of Service, and detecting fraudulent or malicious activities.</Text>
              </ListItem>
            </UnorderedList>
          </Box>

          {/* Cookies & Similar Technologies */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              4. Cookies & Similar Tracking Technologies
            </Heading>
            <Text mb={4}>RemitScout uses cookies, web beacons, and similar technologies to:</Text>
            <UnorderedList spacing={2} pl={4} mb={4}>
              <ListItem><strong>Remember your site preferences</strong> (e.g., chosen origin/destination countries).</ListItem>
              <ListItem><strong>Track and measure site performance</strong>, traffic analytics, or user flow through Google Analytics or similar providers.</ListItem>
              <ListItem><strong>Deliver relevant content</strong>, such as your last-searched remittance details.</ListItem>
            </UnorderedList>
            <Text>You can manage or disable cookies in your browser settings. However, some website features may not function properly without cookies.</Text>
          </Box>

          {/* Data Security */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              5. Data Security
            </Heading>
            <Text mb={4}>
              We implement a range of measures—such as HTTPS encryption, secure servers, and limited 
              access protocols—to safeguard your personal data. Still, no method of online transmission 
              or electronic storage is 100% secure. We strive to protect your personal information but 
              cannot guarantee its absolute security.
            </Text>
          </Box>

          {/* Your Rights */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              6. Your Rights & Choices
            </Heading>
            <Text mb={4}>Depending on your region, you may have rights regarding your personal data, such as:</Text>
            <UnorderedList spacing={2} pl={4} mb={4}>
              <ListItem><strong>Access or Updating</strong>: You can request a copy of your data or update inaccuracies.</ListItem>
              <ListItem><strong>Deletion</strong>: You may ask us to delete your personal information, subject to any legal obligations we have to retain it.</ListItem>
              <ListItem><strong>Opt-Out</strong>: If you have previously opted in to marketing communications, you can unsubscribe or opt out at any time.</ListItem>
            </UnorderedList>
          </Box>

          {/* Contact Information */}
          <Box>
            <Heading as="h2" size="lg" color={headingColor} mb={4}>
              7. Contact Us
            </Heading>
            <Text mb={4}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our 
              data handling practices, please contact us at:
            </Text>
            <Box bg={useColorModeValue('gray.100', 'gray.700')} p={4} borderRadius="md">
              <Text fontWeight="bold">RemitScout</Text>
              <Text>Email: support@remitscout.com</Text>
            </Box>
          </Box>

          {/* Disclaimer */}
          <Box mt={8} p={4} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md">
            <Text fontSize="sm" color="gray.600">
              <strong>Disclaimer:</strong> This document is a general template and may not address all 
              legal requirements relevant to your jurisdiction or business model. Always consult with 
              a qualified attorney to tailor any privacy policy to your specific operations and local laws.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export default PrivacyPolicy; 