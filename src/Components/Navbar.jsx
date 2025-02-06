import React from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { BiWorld } from "react-icons/bi";
import {
  Box,
  Container,
  Stack,
  Spacer,
  Image,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hoverColor = "#00b4d8";

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = (path) => ({
    cursor: "pointer",
    color: isActive(path) ? hoverColor : "inherit",
    _hover: { color: hoverColor },
    px: 2,
    fontWeight: isActive(path) ? "600" : "500",
  });

  return (
    <Box
      bg="white"
      boxShadow="sm"
      borderBottom="1px solid"
      borderColor="gray.200"
      position="sticky"
      top="0"
      zIndex="10"
      py={2}
    >
      <Container maxW="7xl" px={4}>
        <Stack
          direction="row"
          align="center"
          spacing={8}
          height="72px"
        >
          {/* Logo Section */}
          <Box>
            <Link to="/">
              <Image
                src="/logos/remitscout-logo-horizontal-2.svg"
                alt="RemitScout"
                height="230px"
                width="auto"
                style={{ display: 'block' }}
              />
            </Link>
          </Box>

          <Spacer />

          {/* Navigation Links */}
          <Stack
            direction="row"
            spacing={6}
            align="center"
            fontSize="15px"
          >
            <Link to="/">
              <Text {...linkStyle('/')}>
                💸 Send Money
              </Text>
            </Link>
            
            <Link to="/contact">
              <Text {...linkStyle('/contact')}>
                📞 Contact Us
              </Text>
            </Link>

            {/* Language selector */}
            <Stack
              direction="row"
              align="center"
              spacing={1}
              cursor="pointer"
              _hover={{ color: hoverColor }}
              px={2}
            >
              <BiWorld size={18} />
              <Text>English</Text>
              <ChevronDownIcon h={5} w={5} />
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Navbar;
