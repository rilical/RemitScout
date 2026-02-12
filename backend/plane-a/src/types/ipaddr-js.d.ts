declare module 'ipaddr.js' {
  type IP = {
    match: (other: IP, prefix: number) => boolean
    kind?: () => 'ipv4' | 'ipv6'
    toString?: () => string
  }

  const ipaddr: {
    parse: (ip: string) => IP
    parseCIDR: (cidr: string) => [IP, number]
  }

  export default ipaddr
}

