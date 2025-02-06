import React from "react";
import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Image,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Footer = () => {
  const linkColor = useColorModeValue("gray.600", "gray.200");
  const linkHoverColor = "#00b4d8";

  const linkStyle = {
    color: linkColor,
    _hover: { color: linkHoverColor },
    fontSize: "sm",
  };

  return (
    <Box
      bg={useColorModeValue("gray.50", "gray.900")}
      color={useColorModeValue("gray.700", "gray.200")}
      mt="auto"
    >
      <Container as={Stack} maxW="7xl" py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8}>
          {/* Logo and Description */}
          <Stack spacing={6}>
            <Box>
              <Link to="/">
                <Image
                  src="/logos/remitscout-logo-horizontal-2.svg"
                  alt="RemitScout"
                  height="150px"
                  width="auto"
                />
              </Link>
            </Box>
            <Text fontSize="sm">
              Compare money transfer providers to find the best way to send money abroad.
            </Text>
          </Stack>

          {/* Company Links */}
          <Stack align="flex-start">
            <Text fontWeight="600" fontSize="lg" mb={2}>
              Company
            </Text>
            <Link to="/">
              <Text {...linkStyle}>Send Money</Text>
            </Link>
            <Link to="/contact">
              <Text {...linkStyle}>Contact Us</Text>
            </Link>
          </Stack>

          {/* Legal Links */}
          <Stack align="flex-start">
            <Text fontWeight="600" fontSize="lg" mb={2}>
              Legal
            </Text>
            <Link to="/privacy">
              <Text {...linkStyle}>Privacy Policy</Text>
            </Link>
            <Link to="/terms">
              <Text {...linkStyle}>Terms of Service</Text>
            </Link>
          </Stack>
        </SimpleGrid>

        {/* Copyright */}
        <Box borderTopWidth={1} borderStyle="solid" borderColor={useColorModeValue("gray.200", "gray.700")} pt={8} mt={8}>
          <Text textAlign="center" fontSize="sm">
            © {new Date().getFullYear()} RemitScout. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
