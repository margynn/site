+++
title = "P2P et perçage de NAT"
date = '2026-09-27'
draft = false
description = "..."
tags = ["p2p", "network", "go"]
toc = true
readingTime = true
+++

Quand, comme moi on vient du monde du developement Web, et que l'on s'interesse progressivement au reseau et aux systèmes distribués et décentralisés, on sort du modèle familier client-serveur pour se diriger vers le paradigme du pair-à-pair (abrégé P2P). Et en abordant ce paradigme on decouvre une série de problèmes et de contraintes nouvelles que je voudrais partager ici.

<br>

### Distinction Topologique

La difference entre paradigme client-serveur et P2P est plus une **distinction topoligue que technique**. On peut généralement utilisé dans les deux cas, les mêmes protocoles réseaux et la même infrastructure.

Le modèle client-serveur est centralisé. Il suppose deux familles de participants: les clients, qui initient le canal de communication avec les serveurs et qui ne peuvent pas communiquent entre eux. Et le/les serveurs, qui répondent aux communications des clients, sans initier le canal de communication. C'est le modèle le plus repandu sur le web (en excluant WebRTC). Quand un utilisateur ouvre une page web avec son naviguateur, il agit comme un client, qui ouvre un canal de communication avec un serveur (en l'occurence le site web). Si il communique avec d'autres clients, les communications sont relayés par le serveur. (par example des messageries web type discord, whatsapp, slack etc...)

À l'inverse le P2P est décentralisé. Il suppose une seule famille de participants qui agissent à la fois en tant que serveur et client. C'est-à-dire que chaque participant peut initier un canal et communiquer avec n'importe quel autres participants. C'est particulièrement repandu dans des applications type systèmes distribués, blockchain, bittorent, WebRTC.

### NAT

---

sujet:
Nat, udp/tcp, ipv4/ipv6
