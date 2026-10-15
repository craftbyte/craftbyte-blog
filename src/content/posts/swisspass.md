---
title: "Cracking open the SwissPass"
description: "What can this magical Swiss transport card do?"
pubDatetime: 2026-10-15T00:00:00Z
modDatetime: 2026-10-15T00:00:00.000Z
featured: true
tags:
  - switzerland
  - trains
  - transport
---

2 years ago I found out that if you order a [SwissPass](https://swisspass.ch/), they will gladly send it to your address for free, anywhere in the world. Since a lot of my friends and I collect funny transport cards, we immediately got some ordered for ourselves.

I was mostly using it as it was intended, loading my short-time tickets from the ZVV on it when I was in Zürich and using EasyRide in the SBB app (since it requires a card to be issued). I knew that the card supported more features (as they are even advertised on their website), but wasn't really interested in looking deeper into them. This changed recently, when I finally decided to take a crack at it.

# Initial discoveries

I started by looking into what kind of identifiers the card uses. SBB ticket machines seem to use the barcode or QR code with the card ID on the back, while most other ticket machines seem to use the ISO 14443 UID that is read via NFC. Since the card also shows an RFID logo, I was interested. Initial discoveries with my Proxmark 3 showed 2 different chips inside the card (UIDs redacted).

```ansi
[0m[[0;32;1musb[0m] pm3 --> hf search[0m
 🕗 Searching for ISO14443-A tag...           [0m
[[0;33m=[0m] ---------- [0;36mISO14443-A Information[0m ----------[0m
[[0;32m+[0m]  UID: [0;32m04 XX XX XX XX XX 90 [0m  ( double )[0m
[[0;32m+[0m] ATQA: [0;32m00 48[0m[0m
[[0;32m+[0m]  SAK: [0;32m20 [1][0m[0m
[[0;32m+[0m]       [0;33mNXP Semiconductors Germany[0m[0m
[[0;32m+[0m] Possible types:[0m
[[0;32m+[0m]    [0;33mEMV[0m[0m
[[0;33m=[0m] -------------------------- [0;36mATS[0m ----------------------------------[0m
[[0;32m+[0m] ATS: [0;33m0E 78 80 71 02 53 77 69 73 73 50 61 73 73 [0m[ 35 EE ][0m
[[0;33m=[0m]      [0;33m0E[0m...............  TL    length is [0;32m14[0m bytes[0m
[[0;33m=[0m]      ...[0;33m78[0m............  T0    TA1 is present, TB1 is present, TC1 is present, FSCI is 8 (FSC = 256)[0m
[[0;33m=[0m]      ......[0;33m80[0m.........  TA1   different divisors are[0;31m NOT[0m supported, DR: [], DS: [][0m
[[0;33m=[0m]      .........[0;33m71[0m......  TB1   SFGI = 1 (SFGT = 8192/fc), FWI = [0;33m7[0m (FWT = 524288/fc)[0m
[[0;33m=[0m]      ............[0;33m02[0m...  TC1   NAD is[0;31m NOT[0m supported, CID is supported[0m
[0m
[[0;33m=[0m] -------------------- [0;36mHistorical bytes[0m ---------------------------[0m
[[0;32m+[0m] 537769737350617373 - SwissPass[0m
[0m
[[0;33m=[0m] ------------------ [0;36mATR fingerprinting[0m ---------------------------[0m
[[0;32m+[0m]     SwissPass - key to mobility and leisure in Switzerland (Transport)[0m
[[0;32m+[0m]     https://www.swisspass.ch[0m
[[0;32m+[0m]     https://www.allianceswisspass.ch/de/informationen-ov-nutzende/SwissPass[0m
[0m
[[0;33m?[0m] Hint: Try `[0;33memv reader[0m`[0m
[0m
[0m
[[0;32m+[0m] Valid [0;32mISO 14443-A tag[0m found[0m
[0m
[[0;33m?[0m] Hint: Try `[0;33mhf fido[0m` commands[0m
[[0;33m?[0m] Hint: Try `[0;33memv[0m` commands[0m
 🕕 Searching for ISO15693 tag...             [0m
[[0;32m+[0m] UID.... [0;32mE0 XX XX XX XX XX XX EA[0m[0m
[[0;32m+[0m] DSFID.. 02[0m
[[0;32m+[0m] TYPE MATCH [0;33mEM-Marin SA (Skidata); EM4237 [IC id = 15] 23,5pF[0m[0m
[0m
[[0;32m+[0m] Valid [0;32mISO 15693 tag[0m found[0m
[0m
[[0;33m?[0m] Hint: Try `[0;33mhf 15[0m` commands   [0m
```

## The tale of two chips

The ISO 15693 chip seems to be a factory fresh reloadable SKIDATA card, which I confirmed by some sectors matching those that [other people](https://www.proxmark.io/www.proxmark.org/forum/viewtopic.php%3Fid=1528&p=2.html) found. As I don't ski, I wasn't particularly interested in this one.

The ISO 14443 chip seemed to be much more powerful though, claiming it included an EMV and a FIDO applet (which is also noted on [the official website](https://www.swisspass.ch/new-swisspass)). I also scanned the card with NXP TagInfo on my Pixel 9 (after finding the button to disable the ISO 15693 reading as it kept conflicting). The app showed that the card had a Global Platform card manager, PPSE (contactless payments) and 4 applets named `SwissPass`, `Legic`, `Mastercard` and `FIDO`. I also confirmed this with my Proxmark.

```ansi
[0m[[0;32;1musb[0m] pm3 --> emv pse -st2[0m
[[0;33m=[0m] Selected channel... [0;32mCONTACTLESS (T=CL)[0m[0m
[[0;33m=[0m] APDU response status: 9000 - Command successfully executed (OK).[0m
[[0;33m=[0m] -------------------- [0;36mTLV decoded[0m --------------------[0m
[[0;33m=[0m]  --6f[76] 'File Control Information (FCI) Template':[0m
[[0;33m=[0m]     --84[0e] 'Dedicated File (DF) Name':[0m
[[0;33m=[0m]     00: 32 50 41 59 2E 53 59 53 2E 44 44 46 30 31       | 2PAY.SYS.DDF01[0m
[[0;33m=[0m]     --a5[64] 'File Control Information (FCI) Proprietary Template':[0m
[[0;33m=[0m]         --bf0c[61] 'File Control Information (FCI) Issuer Discretionary Data':[0m
[[0;33m=[0m]             --61[1a] 'Application Template':[0m
[[0;33m=[0m]                 --4f[0a] 'Application Dedicated File (ADF) Name':[0m
[[0;33m=[0m]                 00: A0 00 00 06 26 01 01 01 00 01                   | �...&.....[0m
[[0;33m=[0m]                 --50[09] 'Application Label':    String value '[0;33m537769737350617373[0m'[0m
[[0;33m=[0m]                 00: 53 77 69 73 73 50 61 73 73                      | SwissPass[0m
[[0;33m=[0m]                 --87[01] 'Application Priority Indicator':[0m
[[0;33m=[0m]                 00: 01                                              | .[0m
[[0;33m=[0m]             --61[13] 'Application Template':[0m
[[0;33m=[0m]                 --4f[07] 'Application Dedicated File (ADF) Name':[0m
[[0;33m=[0m]                 00: A0 00 00 03 57 00 00                            | �...W..[0m
[[0;33m=[0m]                 --50[05] 'Application Label':    String value '[0;33m4C65676963[0m'[0m
[[0;33m=[0m]                 00: 4C 65 67 69 63                                  | Legic[0m
[[0;33m=[0m]                 --87[01] 'Application Priority Indicator':[0m
[[0;33m=[0m]                 00: 02                                              | .[0m
[[0;33m=[0m]             --61[18] 'Application Template':[0m
[[0;33m=[0m]                 --4f[07] 'Application Dedicated File (ADF) Name':[0m
[[0;33m=[0m]                 00: A0 00 00 00 04 10 10                            | �......[0m
[[0;33m=[0m]                 --50[0a] 'Application Label':    String value '[0;33m4D617374657263617264[0m'[0m
[[0;33m=[0m]                 00: 4D 61 73 74 65 72 63 61 72 64                   | Mastercard[0m
[[0;33m=[0m]                 --87[01] 'Application Priority Indicator':[0m
[[0;33m=[0m]                 00: 03                                              | .[0m
[[0;33m=[0m]             --61[14] 'Application Template':[0m
[[0;33m=[0m]                 --4f[08] 'Application Dedicated File (ADF) Name':[0m
[[0;33m=[0m]                 00: A0 00 00 06 47 2F 00 01                         | �...G/..[0m
[[0;33m=[0m]                 --50[05] 'Application Label':    String value '[0;33m4649444F32[0m'[0m
[[0;33m=[0m]                 00: 46 49 44 4F 32                                  | FIDO2[0m
[[0;33m=[0m]                 --87[01] 'Application Priority Indicator':[0m
[[0;33m=[0m]                 00: 04                                              | .[0m
```

# My SwissPass is a Mastercard??

I was first surprised by the Mastercard applet, so I wanted to know more about it. Reading the PAN of the card, it started with the BIN of `223119`, issued to `Worldline Schweiz AG` for a `MASTERCARD PREPAID NON US GENERAL SPEND`. The applet says it is valid for 5 years from the issue of the card. It is also very limited, only permitting transactions in Swiss Franc with an online PIN validation. As I was going to Bern soon for the [Open Transport Conference](https://open-transport.org), I activated the payment function on my SwissPass [here](https://www.mfgroup.ch/en/swisspass) and loaded up 20 CHF.

The first time I got to a ticket machine, I touched my SwissPass to the EMV terminal when payment was due and it asked me for my PIN (that I set online during activation) and it surprisingly (to me) went through. During the week, I learned it is accepted a lot more than just ticket machines. I was able to use my SwissPass on the station vending machines for example. This is definitely an interesting concept and I like that they used an existing network for this instead of relying on a homebrewed solution for payments.

# Figuring out the SwissPass applet

My next target was the SwissPass applet. The RID of the applet is registered to SwissPass, so it must be the transport function of the card. Looking online, I found [an article](https://persosim.github.io/docs/The_Vault_14_2014.pdf) when the original SwissPass was made that describes the functioning of it. Apparently the card uses EC cryptography and includes a certificate with a "medium ID". This is definitely something we would be interested in. Looking further, I also found [a paper](https://saiconference.com/Downloads/FTC2017/Proceedings/116_Paper_393-Secure_Two-Factor_Authentication_with_SwissPass.pdf) that apparently used these certificates as an authentication method for 2FA.

## Just use brute force?

This made me wonder what the best approach would be to try figuring out how the applet worked. None of the paper code was public and I couldn't find APDU specifications anywhere online. My next option was trying a spray-and-pray by just throwing all CLA and INS combinations at the card. Thankfully, the applet uses proper response codes for "CLA not supported" and "INS not supported", so I could easily discard entire command classes.

By running the enumeration script, I found out the applet responds to 3 CLA/INS combinations, `80 01`, `A0 01` and `A0 02`. `80 01 00 00` responded with `02 04 01 00 00 00`, probably a version, `A0 01 00 00` responded with just `00 93` and interestingly, `A0 02 00 00` responded with `67 00` as the response code, indicating `Wrong length`. This meant `A0 02 00 00` might be the challenge-response command.

By trying different command payloads, I found out that the first byte of the payload is a bitmask of commands for the applet (multiple flags can be set, returning a bigger response).

| Flag | Command |
|---|---|
| `0x01` | Sign challenge (data is after command byte) |
| `0x02` | Read Medium ID |
| `0x04` | Read Compressed P-256 public key |
| `0x08` | Read Compact certificate |

The result is a custom TLV with a 1-byte tag and 1-byte length indicator.

| Tag | Value |
|---|---|
| `0x01` | ECDSA signature of challenge |
| `0x03` | Compact certificate |
| `0x04` | Medium ID |
| `0x05` | Compressed P-256 public key |

Figuring this out also explained the return of `A0 01`, which is the length of the certificate.

## The "insane" certificate format

The compact certificate is made up of the following components (`x` indicates the length specified in the previous element):

| Length | Field |
|---|---|
| 1 | Version (should be `02`) |
| 16 | Medium ID |
| 1 | Issuer name length |
| x | Issuer name (should be `SwissPass_CA_1`) |
| 5 | Valid from: unsigned big-endian Unix seconds |
| 5 | Valid to: unsigned big-endian Unix seconds |
| 1 | Compressed public-key length |
| x | Compressed public key |
| 1 | Issuer signature length |
| x | DER-encoded issuer ECDSA signature |

The ECDSA signature is not done over the compressed form, but instead over a reconstructed X.509 `TBSCertificate` from the data in the compressed certificate. The ASN.1 schema for the certificate follows.

```
TBSCertificate ::= SEQUENCE {
    version         [0] EXPLICIT Version v3,

    serialNumber    INTEGER <16-byte MediumID>,

    signature       SEQUENCE {
        OBJECT IDENTIFIER ecdsa-with-SHA256
    },

    issuer          SEQUENCE {
        SET {
            SEQUENCE {
                OBJECT IDENTIFIER commonName,
                UTF8String <issuerName>
            }
        }
    },

    validity        SEQUENCE {
        UTCTime <notBefore>,
        UTCTime <notAfter>
    },

    subject         SEQUENCE {
        SET {
            SEQUENCE {
                OBJECT IDENTIFIER commonName,
                UTF8String <32-char-uppercase-MediumID>
            }
        }
    },

    subjectPublicKeyInfo SEQUENCE {
        SEQUENCE {
            OBJECT IDENTIFIER id-ecPublicKey,
            OBJECT IDENTIFIER prime256v1
        },
        BIT STRING <04 || X(32) || Y(32)>
    }
}
```

The `SwissPass_CA_1` public key that I recovered from the SwissPass cards I had access to is below.

```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwHc4CcLWc6j6yFoa8vOvEx5TdD5e
QuoHaXuF1Tbg8t7wWB4k5YyhtgaBZLA+XJvuHIRVU2x6Ao+hRRlRua9VMw==
-----END PUBLIC KEY-----
```

This key has validated all SwissPass cards we have seen in the wild for now.

The challenge-response flow requires either a 32 or 64-byte challenge and returns an ECDSA-SHA256 signature of it with the card private key that can be validated with the public key in the certificate.

# Quick Dip into FIDO

I also took a quick glance at the FIDO applet. Since we know how those work, I was only interested in the card-specific data like the AAGUID and the attestation certificate. The AAGUID of my SwissPass is `37fecf7b-87a6-a14e-befe-42ff4412fa27` and the attestation certificate is below. Surprisingly it seems to also be signed by the SwissPass CA we found from the card-specific certificate. It also appears that the AAGUID is not on the FIDO Alliance Metadata Service.

```
-----BEGIN CERTIFICATE-----
MIIBnjCCAUWgAwIBAgIQBmD7fgjDtNAPHzcphdUjZzAKBggqhkjOPQQDAjAZMRcw
FQYDVQQDDA5Td2lzc1Bhc3NfQ0FfMTAeFw0yMTA4MzEwMDAwMDBaFw00MTA4MzEy
MzU5NTlaMFgxCzAJBgNVBAYMAkNIMQwwCgYDVQQKDANTQkIxIjAgBgNVBAsMGUF1
dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xFzAVBgNVBAMMDlN3aXNzUGFzcyBGSURP
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEaZVOl+5lBvBWuimbFzv+v06V5iQt
rzbB/19h2xiPKabKYsMcV5pifHuQpao5P4Fo75cmm8s0Q/X/G2XaORyiIKMwMC4w
CQYDVR0TBAIwADAhBgsrBgEEAYLlHAEBBAQSBBA3/s97h6ahTr7+Qv9EEvonMAoG
CCqGSM49BAMCA0cAMEQCIAGxYJYj9NvpCH3m0dSLo55u6Kxbqe2ao5uEQQS3dytH
AiAeNhT+e5XcmyNejTgHFyV+pmARjKiNyUtbIAGK3vz7mw==
-----END CERTIFICATE-----
```

# The Legic applet

The SwissPass also seems to hold a LEGIC advant applet. Since the LEGIC advant system has not been reverse engineered by anyone yet, it is very hard to figure out what the applet does. The CLA/INS enumeration did not bear any fruits. The one file I was able to read did indicate that the chip seems to be an NXP SmartMX3 P71 with JCOP4 though. There is one [page](https://business.sbb.ch/en/consulting/your-advantages/cost-optimisation.html) that seems to mention the LEGIC applet on the SBB Business page, but it requires a phone call with SBB.

# Future ideas

With this information, I am thinking of creating an access control reader that just performs the challenge response flow and uses the Medium ID as the primary key. I will hopefully post it on my GitHub soon. If anyone has other ideas to use, feel free to @ me on fedi if you need any help or run into problems.