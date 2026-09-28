package test

import (
	"net"
)

func tcp() {
	// port 0 -> let the OS choose the port
	conn, err := net.ListenUDP("udp", &net.UDPAddr{Port: 0})
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	a := &net.UDPAddr{IP: net.ParseIP("1.2.3.4"), Port: 5000}
	b := &net.UDPAddr{IP: net.ParseIP("5.6.7.8"), Port: 6000}

	conn.WriteToUDP([]byte("hello A"), a)
	conn.WriteToUDP([]byte("hello B"), b)
}
