+++
title = "Computer Systems: A Programmer's Perspective"
date = '2026-08-01'
draft = false
author = "Randal E. Bryant, David R. O'Hallaron"
status = "reading"
description = "Socle fondamentale du programmer"
tags = ["systems", "programming"]
+++

{{< linkcard url="https://www.cs.sfu.ca/~ashriram/Courses/CS295/assets/books/CSAPP_2016.pdf" title="CSAPP pdf" >}}

Je commence à le lire un peu tard. J'aurais préféré connaitre cet ouvrage plus tôt. C'est un manuel assez fondateur pour tout bon developpeur. L'ouvrage se concentre principalement sur le C (comme support), mais les abstractions qu'ils expliquent sont transversales a plein de languages.

C'est une presentation des fondamentaux: fonctionnement d'un OS (memoire virtuelle, process, threads, files), compilation, réseau, integer arithmétique etc... Cela consolide les intuitions et connaissances que j'ai déjà acquis avec le temps.

---

# Integer Arithmétique (Part 2.)

J'ai skip une bonne partie de equations sur l'Integer Arithmétique. C'est pas vraiment utile d'apprendre ces equations. Et certaine parties sont spécifique à C uniquement. Il faut retenir (en vrac):

- Representation binaire complément à deux (pour les entiers signé)
  - TLDR: le MSB devient negatif donc en 4 bits: `1000` devient `-8` en decimal et c'est le plus petit entier negatif que l'on peut représenter. Et `0111` (`7` en décimal) le plus grand positif.
- Bit shifts Left/Right: multiplication et division par 2
- Overflow / underflow par addition, soustraction, multiplication.
- Big-endian / little-endian:
  - Sur la majorité des machines moderne on utiliser `little-endian` càd que la representation binaire stockes les LSB (least significant bits) à droite (addresse plus basse). Il faut l'avoir en tête principalement quand on lit de l'assembleur, pour faire correspondre la representation binaire a la bonne valeur numérique.
- [Spécifique en C] Prévalence et casting automatique des `Unsigned` en `Signed`. Cela peut créer des cas assez étrange type: `0U > -1 == False` car (`-1` est cast en `unsigned` et devient une tres grande valeur).
  > We have seen multiple ways in which the subtle features of unsigned arithmetic, and especially the implicit conversion of signed to unsigned, can lead to errors or vulnerabilities. One way to avoid such bugs is to never use unsigned numbers.
