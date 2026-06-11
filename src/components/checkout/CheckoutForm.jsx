import { useState, useCallback, useRef, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

// ─── WhatsApp config ──────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = '5511999990000'; // edite aqui (DDI + DDD + número)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatCEP(v) {
  return v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}
function formatCPF(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}
function isCPFValid(v) { return v.replace(/\D/g, '').length === 11; }

// ─── Mock email API ───────────────────────────────────────────────────────────
async function mockSendConfirmationEmail(email, orderData) {
  // Simulates an async transactional email API call (e.g. SendGrid / Resend)
  await new Promise((r) => setTimeout(r, 900));
  console.info('[LabPrime] Confirmation email dispatched to:', email, orderData);
  return { ok: true, messageId: `LP-MSG-${Date.now()}` };
}

// ─── Global phone country codes (ITU-T E.164, 240+ countries) ────────────────
const PHONE_COUNTRIES = [
  // ── Most used first ──
  { dial: '55',  code: 'BR', flag: '🇧🇷', name: 'Brasil',               min: 10, max: 11 },
  { dial: '1',   code: 'US', flag: '🇺🇸', name: 'USA / Canada',         min: 10, max: 10 },
  { dial: '44',  code: 'GB', flag: '🇬🇧', name: 'United Kingdom',       min: 10, max: 11 },
  { dial: '49',  code: 'DE', flag: '🇩🇪', name: 'Alemanha',             min: 10, max: 12 },
  { dial: '33',  code: 'FR', flag: '🇫🇷', name: 'França',               min: 9,  max: 9  },
  { dial: '34',  code: 'ES', flag: '🇪🇸', name: 'Espanha',              min: 9,  max: 9  },
  { dial: '39',  code: 'IT', flag: '🇮🇹', name: 'Itália',               min: 9,  max: 11 },
  { dial: '351', code: 'PT', flag: '🇵🇹', name: 'Portugal',             min: 9,  max: 9  },
  { dial: '54',  code: 'AR', flag: '🇦🇷', name: 'Argentina',            min: 10, max: 11 },
  { dial: '56',  code: 'CL', flag: '🇨🇱', name: 'Chile',               min: 9,  max: 9  },
  { dial: '52',  code: 'MX', flag: '🇲🇽', name: 'México',              min: 10, max: 10 },
  { dial: '57',  code: 'CO', flag: '🇨🇴', name: 'Colômbia',            min: 10, max: 10 },
  { dial: '51',  code: 'PE', flag: '🇵🇪', name: 'Peru',                min: 9,  max: 9  },
  { dial: '61',  code: 'AU', flag: '🇦🇺', name: 'Austrália',           min: 9,  max: 9  },
  { dial: '81',  code: 'JP', flag: '🇯🇵', name: 'Japão',               min: 10, max: 11 },
  { dial: '86',  code: 'CN', flag: '🇨🇳', name: 'China',               min: 11, max: 11 },
  // ── Rest of the world alphabetically ──
  { dial: '93',  code: 'AF', flag: '🇦🇫', name: 'Afeganistão',         min: 9,  max: 9  },
  { dial: '355', code: 'AL', flag: '🇦🇱', name: 'Albânia',             min: 9,  max: 9  },
  { dial: '213', code: 'DZ', flag: '🇩🇿', name: 'Argélia',             min: 9,  max: 9  },
  { dial: '376', code: 'AD', flag: '🇦🇩', name: 'Andorra',             min: 6,  max: 9  },
  { dial: '244', code: 'AO', flag: '🇦🇴', name: 'Angola',              min: 9,  max: 9  },
  { dial: '1264',code: 'AI', flag: '🇦🇮', name: 'Anguilla',            min: 10, max: 10 },
  { dial: '1268',code: 'AG', flag: '🇦🇬', name: 'Antígua e Barbuda',   min: 10, max: 10 },
  { dial: '374', code: 'AM', flag: '🇦🇲', name: 'Armênia',             min: 8,  max: 8  },
  { dial: '297', code: 'AW', flag: '🇦🇼', name: 'Aruba',               min: 7,  max: 7  },
  { dial: '43',  code: 'AT', flag: '🇦🇹', name: 'Áustria',             min: 10, max: 13 },
  { dial: '994', code: 'AZ', flag: '🇦🇿', name: 'Azerbaijão',          min: 9,  max: 9  },
  { dial: '1242',code: 'BS', flag: '🇧🇸', name: 'Bahamas',             min: 10, max: 10 },
  { dial: '973', code: 'BH', flag: '🇧🇭', name: 'Bahrein',             min: 8,  max: 8  },
  { dial: '880', code: 'BD', flag: '🇧🇩', name: 'Bangladesh',          min: 10, max: 10 },
  { dial: '1246',code: 'BB', flag: '🇧🇧', name: 'Barbados',            min: 10, max: 10 },
  { dial: '375', code: 'BY', flag: '🇧🇾', name: 'Bielorrússia',        min: 9,  max: 9  },
  { dial: '32',  code: 'BE', flag: '🇧🇪', name: 'Bélgica',             min: 9,  max: 9  },
  { dial: '501', code: 'BZ', flag: '🇧🇿', name: 'Belize',              min: 7,  max: 7  },
  { dial: '229', code: 'BJ', flag: '🇧🇯', name: 'Benin',               min: 8,  max: 8  },
  { dial: '1441',code: 'BM', flag: '🇧🇲', name: 'Bermudas',            min: 10, max: 10 },
  { dial: '975', code: 'BT', flag: '🇧🇹', name: 'Butão',               min: 8,  max: 8  },
  { dial: '591', code: 'BO', flag: '🇧🇴', name: 'Bolívia',             min: 8,  max: 8  },
  { dial: '387', code: 'BA', flag: '🇧🇦', name: 'Bósnia e Herzegovina', min: 8, max: 8  },
  { dial: '267', code: 'BW', flag: '🇧🇼', name: 'Botswana',            min: 8,  max: 8  },
  { dial: '673', code: 'BN', flag: '🇧🇳', name: 'Brunei',              min: 7,  max: 7  },
  { dial: '359', code: 'BG', flag: '🇧🇬', name: 'Bulgária',            min: 9,  max: 9  },
  { dial: '226', code: 'BF', flag: '🇧🇫', name: 'Burkina Faso',        min: 8,  max: 8  },
  { dial: '257', code: 'BI', flag: '🇧🇮', name: 'Burundi',             min: 8,  max: 8  },
  { dial: '238', code: 'CV', flag: '🇨🇻', name: 'Cabo Verde',          min: 7,  max: 7  },
  { dial: '855', code: 'KH', flag: '🇰🇭', name: 'Camboja',             min: 9,  max: 9  },
  { dial: '237', code: 'CM', flag: '🇨🇲', name: 'Camarões',            min: 9,  max: 9  },
  { dial: '236', code: 'CF', flag: '🇨🇫', name: 'República Centro-Africana', min: 8, max: 8 },
  { dial: '235', code: 'TD', flag: '🇹🇩', name: 'Chade',               min: 8,  max: 8  },
  { dial: '420', code: 'CZ', flag: '🇨🇿', name: 'República Tcheca',    min: 9,  max: 9  },
  { dial: '269', code: 'KM', flag: '🇰🇲', name: 'Comores',             min: 7,  max: 7  },
  { dial: '242', code: 'CG', flag: '🇨🇬', name: 'Congo',               min: 9,  max: 9  },
  { dial: '243', code: 'CD', flag: '🇨🇩', name: 'Congo (RDC)',         min: 9,  max: 9  },
  { dial: '682', code: 'CK', flag: '🇨🇰', name: 'Ilhas Cook',          min: 5,  max: 5  },
  { dial: '506', code: 'CR', flag: '🇨🇷', name: 'Costa Rica',          min: 8,  max: 8  },
  { dial: '225', code: 'CI', flag: '🇨🇮', name: 'Costa do Marfim',     min: 10, max: 10 },
  { dial: '385', code: 'HR', flag: '🇭🇷', name: 'Croácia',             min: 8,  max: 9  },
  { dial: '53',  code: 'CU', flag: '🇨🇺', name: 'Cuba',                min: 8,  max: 8  },
  { dial: '599', code: 'CW', flag: '🇨🇼', name: 'Curaçao',             min: 7,  max: 8  },
  { dial: '357', code: 'CY', flag: '🇨🇾', name: 'Chipre',              min: 8,  max: 8  },
  { dial: '45',  code: 'DK', flag: '🇩🇰', name: 'Dinamarca',           min: 8,  max: 8  },
  { dial: '253', code: 'DJ', flag: '🇩🇯', name: 'Djibuti',             min: 8,  max: 8  },
  { dial: '1767',code: 'DM', flag: '🇩🇲', name: 'Dominica',            min: 10, max: 10 },
  { dial: '1809',code: 'DO', flag: '🇩🇴', name: 'República Dominicana',min: 10, max: 10 },
  { dial: '593', code: 'EC', flag: '🇪🇨', name: 'Equador',             min: 9,  max: 9  },
  { dial: '20',  code: 'EG', flag: '🇪🇬', name: 'Egito',               min: 10, max: 10 },
  { dial: '503', code: 'SV', flag: '🇸🇻', name: 'El Salvador',         min: 8,  max: 8  },
  { dial: '240', code: 'GQ', flag: '🇬🇶', name: 'Guiné Equatorial',    min: 9,  max: 9  },
  { dial: '291', code: 'ER', flag: '🇪🇷', name: 'Eritreia',            min: 7,  max: 7  },
  { dial: '372', code: 'EE', flag: '🇪🇪', name: 'Estônia',             min: 7,  max: 10 },
  { dial: '268', code: 'SZ', flag: '🇸🇿', name: 'Eswatini',            min: 8,  max: 8  },
  { dial: '251', code: 'ET', flag: '🇪🇹', name: 'Etiópia',             min: 9,  max: 9  },
  { dial: '679', code: 'FJ', flag: '🇫🇯', name: 'Fiji',                min: 7,  max: 7  },
  { dial: '358', code: 'FI', flag: '🇫🇮', name: 'Finlândia',           min: 9,  max: 11 },
  { dial: '241', code: 'GA', flag: '🇬🇦', name: 'Gabão',               min: 8,  max: 8  },
  { dial: '220', code: 'GM', flag: '🇬🇲', name: 'Gâmbia',              min: 7,  max: 7  },
  { dial: '995', code: 'GE', flag: '🇬🇪', name: 'Geórgia',             min: 9,  max: 9  },
  { dial: '233', code: 'GH', flag: '🇬🇭', name: 'Gana',                min: 9,  max: 9  },
  { dial: '30',  code: 'GR', flag: '🇬🇷', name: 'Grécia',              min: 10, max: 10 },
  { dial: '1473',code: 'GD', flag: '🇬🇩', name: 'Granada',             min: 10, max: 10 },
  { dial: '502', code: 'GT', flag: '🇬🇹', name: 'Guatemala',           min: 8,  max: 8  },
  { dial: '224', code: 'GN', flag: '🇬🇳', name: 'Guiné',               min: 9,  max: 9  },
  { dial: '245', code: 'GW', flag: '🇬🇼', name: 'Guiné-Bissau',        min: 7,  max: 7  },
  { dial: '592', code: 'GY', flag: '🇬🇾', name: 'Guiana',              min: 7,  max: 7  },
  { dial: '509', code: 'HT', flag: '🇭🇹', name: 'Haiti',               min: 8,  max: 8  },
  { dial: '504', code: 'HN', flag: '🇭🇳', name: 'Honduras',            min: 8,  max: 8  },
  { dial: '852', code: 'HK', flag: '🇭🇰', name: 'Hong Kong',           min: 8,  max: 8  },
  { dial: '36',  code: 'HU', flag: '🇭🇺', name: 'Hungria',             min: 9,  max: 9  },
  { dial: '354', code: 'IS', flag: '🇮🇸', name: 'Islândia',            min: 7,  max: 7  },
  { dial: '91',  code: 'IN', flag: '🇮🇳', name: 'Índia',               min: 10, max: 10 },
  { dial: '62',  code: 'ID', flag: '🇮🇩', name: 'Indonésia',           min: 9,  max: 12 },
  { dial: '98',  code: 'IR', flag: '🇮🇷', name: 'Irã',                 min: 10, max: 10 },
  { dial: '964', code: 'IQ', flag: '🇮🇶', name: 'Iraque',              min: 10, max: 10 },
  { dial: '353', code: 'IE', flag: '🇮🇪', name: 'Irlanda',             min: 9,  max: 9  },
  { dial: '972', code: 'IL', flag: '🇮🇱', name: 'Israel',              min: 9,  max: 9  },
  { dial: '1876',code: 'JM', flag: '🇯🇲', name: 'Jamaica',             min: 10, max: 10 },
  { dial: '962', code: 'JO', flag: '🇯🇴', name: 'Jordânia',            min: 9,  max: 9  },
  { dial: '7',   code: 'KZ', flag: '🇰🇿', name: 'Cazaquistão',         min: 10, max: 10 },
  { dial: '254', code: 'KE', flag: '🇰🇪', name: 'Quênia',              min: 9,  max: 10 },
  { dial: '686', code: 'KI', flag: '🇰🇮', name: 'Quiribati',           min: 5,  max: 8  },
  { dial: '383', code: 'XK', flag: '🇽🇰', name: 'Kosovo',              min: 8,  max: 8  },
  { dial: '965', code: 'KW', flag: '🇰🇼', name: 'Kuwait',              min: 8,  max: 8  },
  { dial: '996', code: 'KG', flag: '🇰🇬', name: 'Quirguistão',         min: 9,  max: 9  },
  { dial: '856', code: 'LA', flag: '🇱🇦', name: 'Laos',                min: 9,  max: 9  },
  { dial: '371', code: 'LV', flag: '🇱🇻', name: 'Letônia',             min: 8,  max: 8  },
  { dial: '961', code: 'LB', flag: '🇱🇧', name: 'Líbano',              min: 8,  max: 8  },
  { dial: '266', code: 'LS', flag: '🇱🇸', name: 'Lesoto',              min: 8,  max: 8  },
  { dial: '231', code: 'LR', flag: '🇱🇷', name: 'Libéria',             min: 8,  max: 8  },
  { dial: '218', code: 'LY', flag: '🇱🇾', name: 'Líbia',               min: 9,  max: 9  },
  { dial: '423', code: 'LI', flag: '🇱🇮', name: 'Liechtenstein',       min: 7,  max: 9  },
  { dial: '370', code: 'LT', flag: '🇱🇹', name: 'Lituânia',            min: 8,  max: 8  },
  { dial: '352', code: 'LU', flag: '🇱🇺', name: 'Luxemburgo',          min: 9,  max: 11 },
  { dial: '853', code: 'MO', flag: '🇲🇴', name: 'Macau',               min: 8,  max: 8  },
  { dial: '261', code: 'MG', flag: '🇲🇬', name: 'Madagascar',          min: 9,  max: 9  },
  { dial: '265', code: 'MW', flag: '🇲🇼', name: 'Malawi',              min: 9,  max: 9  },
  { dial: '60',  code: 'MY', flag: '🇲🇾', name: 'Malásia',             min: 9,  max: 10 },
  { dial: '960', code: 'MV', flag: '🇲🇻', name: 'Maldivas',            min: 7,  max: 7  },
  { dial: '223', code: 'ML', flag: '🇲🇱', name: 'Mali',                min: 8,  max: 8  },
  { dial: '356', code: 'MT', flag: '🇲🇹', name: 'Malta',               min: 8,  max: 8  },
  { dial: '692', code: 'MH', flag: '🇲🇭', name: 'Ilhas Marshall',      min: 7,  max: 7  },
  { dial: '222', code: 'MR', flag: '🇲🇷', name: 'Mauritânia',          min: 8,  max: 8  },
  { dial: '230', code: 'MU', flag: '🇲🇺', name: 'Maurício',            min: 8,  max: 8  },
  { dial: '691', code: 'FM', flag: '🇫🇲', name: 'Micronésia',          min: 7,  max: 7  },
  { dial: '373', code: 'MD', flag: '🇲🇩', name: 'Moldávia',            min: 8,  max: 8  },
  { dial: '377', code: 'MC', flag: '🇲🇨', name: 'Mônaco',              min: 8,  max: 9  },
  { dial: '976', code: 'MN', flag: '🇲🇳', name: 'Mongólia',            min: 8,  max: 8  },
  { dial: '382', code: 'ME', flag: '🇲🇪', name: 'Montenegro',          min: 8,  max: 8  },
  { dial: '212', code: 'MA', flag: '🇲🇦', name: 'Marrocos',            min: 9,  max: 9  },
  { dial: '258', code: 'MZ', flag: '🇲🇿', name: 'Moçambique',          min: 9,  max: 9  },
  { dial: '264', code: 'NA', flag: '🇳🇦', name: 'Namíbia',             min: 9,  max: 9  },
  { dial: '674', code: 'NR', flag: '🇳🇷', name: 'Nauru',               min: 7,  max: 7  },
  { dial: '977', code: 'NP', flag: '🇳🇵', name: 'Nepal',               min: 10, max: 10 },
  { dial: '31',  code: 'NL', flag: '🇳🇱', name: 'Países Baixos',       min: 9,  max: 9  },
  { dial: '64',  code: 'NZ', flag: '🇳🇿', name: 'Nova Zelândia',       min: 8,  max: 10 },
  { dial: '505', code: 'NI', flag: '🇳🇮', name: 'Nicarágua',           min: 8,  max: 8  },
  { dial: '227', code: 'NE', flag: '🇳🇪', name: 'Níger',               min: 8,  max: 8  },
  { dial: '234', code: 'NG', flag: '🇳🇬', name: 'Nigéria',             min: 10, max: 10 },
  { dial: '850', code: 'KP', flag: '🇰🇵', name: 'Coreia do Norte',     min: 9,  max: 10 },
  { dial: '389', code: 'MK', flag: '🇲🇰', name: 'Macedônia do Norte',  min: 8,  max: 8  },
  { dial: '47',  code: 'NO', flag: '🇳🇴', name: 'Noruega',             min: 8,  max: 8  },
  { dial: '968', code: 'OM', flag: '🇴🇲', name: 'Omã',                 min: 8,  max: 8  },
  { dial: '92',  code: 'PK', flag: '🇵🇰', name: 'Paquistão',           min: 10, max: 10 },
  { dial: '680', code: 'PW', flag: '🇵🇼', name: 'Palau',               min: 7,  max: 7  },
  { dial: '970', code: 'PS', flag: '🇵🇸', name: 'Palestina',           min: 9,  max: 9  },
  { dial: '507', code: 'PA', flag: '🇵🇦', name: 'Panamá',              min: 8,  max: 8  },
  { dial: '675', code: 'PG', flag: '🇵🇬', name: 'Papua Nova Guiné',    min: 8,  max: 8  },
  { dial: '595', code: 'PY', flag: '🇵🇾', name: 'Paraguai',            min: 9,  max: 9  },
  { dial: '63',  code: 'PH', flag: '🇵🇭', name: 'Filipinas',           min: 10, max: 10 },
  { dial: '48',  code: 'PL', flag: '🇵🇱', name: 'Polônia',             min: 9,  max: 9  },
  { dial: '974', code: 'QA', flag: '🇶🇦', name: 'Catar',               min: 8,  max: 8  },
  { dial: '40',  code: 'RO', flag: '🇷🇴', name: 'Romênia',             min: 9,  max: 9  },
  { dial: '7',   code: 'RU', flag: '🇷🇺', name: 'Rússia',              min: 10, max: 10 },
  { dial: '250', code: 'RW', flag: '🇷🇼', name: 'Ruanda',              min: 9,  max: 9  },
  { dial: '1869',code: 'KN', flag: '🇰🇳', name: 'São Cristóvão e Nevis',min:10, max: 10 },
  { dial: '1758',code: 'LC', flag: '🇱🇨', name: 'Santa Lúcia',         min: 10, max: 10 },
  { dial: '1784',code: 'VC', flag: '🇻🇨', name: 'São Vicente e Granadinas', min:10, max:10 },
  { dial: '685', code: 'WS', flag: '🇼🇸', name: 'Samoa',               min: 7,  max: 7  },
  { dial: '378', code: 'SM', flag: '🇸🇲', name: 'San Marino',          min: 6,  max: 10 },
  { dial: '239', code: 'ST', flag: '🇸🇹', name: 'São Tomé e Príncipe', min: 7,  max: 7  },
  { dial: '966', code: 'SA', flag: '🇸🇦', name: 'Arábia Saudita',      min: 9,  max: 9  },
  { dial: '221', code: 'SN', flag: '🇸🇳', name: 'Senegal',             min: 9,  max: 9  },
  { dial: '381', code: 'RS', flag: '🇷🇸', name: 'Sérvia',              min: 9,  max: 12 },
  { dial: '248', code: 'SC', flag: '🇸🇨', name: 'Seychelles',          min: 7,  max: 7  },
  { dial: '232', code: 'SL', flag: '🇸🇱', name: 'Serra Leoa',          min: 8,  max: 8  },
  { dial: '65',  code: 'SG', flag: '🇸🇬', name: 'Singapura',           min: 8,  max: 8  },
  { dial: '421', code: 'SK', flag: '🇸🇰', name: 'Eslováquia',          min: 9,  max: 9  },
  { dial: '386', code: 'SI', flag: '🇸🇮', name: 'Eslovênia',           min: 8,  max: 8  },
  { dial: '677', code: 'SB', flag: '🇸🇧', name: 'Ilhas Salomão',       min: 7,  max: 7  },
  { dial: '252', code: 'SO', flag: '🇸🇴', name: 'Somália',             min: 8,  max: 9  },
  { dial: '27',  code: 'ZA', flag: '🇿🇦', name: 'África do Sul',       min: 9,  max: 9  },
  { dial: '82',  code: 'KR', flag: '🇰🇷', name: 'Coreia do Sul',       min: 9,  max: 11 },
  { dial: '211', code: 'SS', flag: '🇸🇸', name: 'Sudão do Sul',        min: 9,  max: 9  },
  { dial: '94',  code: 'LK', flag: '🇱🇰', name: 'Sri Lanka',           min: 9,  max: 9  },
  { dial: '249', code: 'SD', flag: '🇸🇩', name: 'Sudão',               min: 9,  max: 9  },
  { dial: '597', code: 'SR', flag: '🇸🇷', name: 'Suriname',            min: 7,  max: 7  },
  { dial: '46',  code: 'SE', flag: '🇸🇪', name: 'Suécia',              min: 9,  max: 9  },
  { dial: '41',  code: 'CH', flag: '🇨🇭', name: 'Suíça',               min: 9,  max: 9  },
  { dial: '963', code: 'SY', flag: '🇸🇾', name: 'Síria',               min: 9,  max: 9  },
  { dial: '886', code: 'TW', flag: '🇹🇼', name: 'Taiwan',              min: 9,  max: 9  },
  { dial: '992', code: 'TJ', flag: '🇹🇯', name: 'Tajiquistão',         min: 9,  max: 9  },
  { dial: '255', code: 'TZ', flag: '🇹🇿', name: 'Tanzânia',            min: 9,  max: 9  },
  { dial: '66',  code: 'TH', flag: '🇹🇭', name: 'Tailândia',           min: 9,  max: 9  },
  { dial: '670', code: 'TL', flag: '🇹🇱', name: 'Timor-Leste',         min: 8,  max: 8  },
  { dial: '228', code: 'TG', flag: '🇹🇬', name: 'Togo',                min: 8,  max: 8  },
  { dial: '676', code: 'TO', flag: '🇹🇴', name: 'Tonga',               min: 7,  max: 7  },
  { dial: '1868',code: 'TT', flag: '🇹🇹', name: 'Trinidad e Tobago',   min: 10, max: 10 },
  { dial: '216', code: 'TN', flag: '🇹🇳', name: 'Tunísia',             min: 8,  max: 8  },
  { dial: '90',  code: 'TR', flag: '🇹🇷', name: 'Turquia',             min: 10, max: 10 },
  { dial: '993', code: 'TM', flag: '🇹🇲', name: 'Turcomenistão',       min: 8,  max: 8  },
  { dial: '688', code: 'TV', flag: '🇹🇻', name: 'Tuvalu',              min: 6,  max: 6  },
  { dial: '256', code: 'UG', flag: '🇺🇬', name: 'Uganda',              min: 9,  max: 9  },
  { dial: '380', code: 'UA', flag: '🇺🇦', name: 'Ucrânia',             min: 9,  max: 9  },
  { dial: '971', code: 'AE', flag: '🇦🇪', name: 'Emirados Árabes',     min: 9,  max: 9  },
  { dial: '598', code: 'UY', flag: '🇺🇾', name: 'Uruguai',             min: 8,  max: 9  },
  { dial: '998', code: 'UZ', flag: '🇺🇿', name: 'Uzbequistão',         min: 9,  max: 9  },
  { dial: '678', code: 'VU', flag: '🇻🇺', name: 'Vanuatu',             min: 7,  max: 7  },
  { dial: '58',  code: 'VE', flag: '🇻🇪', name: 'Venezuela',           min: 10, max: 10 },
  { dial: '84',  code: 'VN', flag: '🇻🇳', name: 'Vietnã',              min: 9,  max: 10 },
  { dial: '967', code: 'YE', flag: '🇾🇪', name: 'Iêmen',               min: 9,  max: 9  },
  { dial: '260', code: 'ZM', flag: '🇿🇲', name: 'Zâmbia',              min: 9,  max: 9  },
  { dial: '263', code: 'ZW', flag: '🇿🇼', name: 'Zimbábue',            min: 9,  max: 9  },
];

function formatPhoneByCountry(raw, dial) {
  const d = raw.replace(/\D/g, '');
  const country = PHONE_COUNTRIES.find((c) => c.dial === dial) ?? PHONE_COUNTRIES[0];
  const digits = d.slice(0, country.max);
  if (dial === '55') {
    if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
  }
  if (dial === '1' || dial === '1876' || dial === '1868' || dial.startsWith('1'))
    return digits.replace(/^(\d{3})(\d{3})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
  if (dial === '44') return digits.replace(/^(\d{5})(\d{0,6})/, '$1 $2').trim();
  return digits.replace(/(\d{3,4})(?=\d)/g, '$1 ').trim();
}

function isPhoneValid(number, dial) {
  const digits = number.replace(/\D/g, '');
  const c = PHONE_COUNTRIES.find((c) => c.dial === dial) ?? PHONE_COUNTRIES[0];
  return digits.length >= c.min;
}

// ─── Delivery country list ────────────────────────────────────────────────────
const DELIVERY_COUNTRIES = [
  { code: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'GB', flag: '🇬🇧', name: 'Reino Unido' },
  { code: 'DE', flag: '🇩🇪', name: 'Alemanha' },
  { code: 'FR', flag: '🇫🇷', name: 'França' },
  { code: 'ES', flag: '🇪🇸', name: 'Espanha' },
  { code: 'IT', flag: '🇮🇹', name: 'Itália' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: 'MX', flag: '🇲🇽', name: 'México' },
  { code: 'CO', flag: '🇨🇴', name: 'Colômbia' },
  { code: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: 'JP', flag: '🇯🇵', name: 'Japão' },
  { code: 'AU', flag: '🇦🇺', name: 'Austrália' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadá' },
  { code: 'CN', flag: '🇨🇳', name: 'China' },
  { code: 'OTHER', flag: '🌍', name: 'Outro país' },
];

// ─── WhatsApp message builder ─────────────────────────────────────────────────
function buildWhatsAppURL(personal, address, items, subtotal) {
  const shipping = subtotal >= 500 ? 0 : 35;
  const total    = subtotal + shipping;
  const isBR     = address.country === 'BR';

  const addressLine = isBR
    ? [address.logradouro + ', ' + address.numero, address.complemento || null, address.bairro, address.cidade + '/' + address.estado, 'CEP ' + address.cep].filter(Boolean).join(' – ')
    : [address.logradouro, address.numero ? 'Nº ' + address.numero : null, address.complemento || null, address.cidade, address.estado || null, address.postalCode ? 'Postal: ' + address.postalCode : null, DELIVERY_COUNTRIES.find((c) => c.code === address.country)?.name ?? address.country].filter(Boolean).join(' – ');

  const docLine = personal.docSkipped
    ? `Documento: não informado – Motivo: ${personal.docMotivo}`
    : personal.dialCode === '55'
    ? `CPF: ${personal.documento}`
    : `Documento: ${personal.documento}`;

  const itemLines = items.map((i) => `  • ${i.quantity}× ${i.name}: ${formatBRL(i.price * i.quantity)}`).join('\n');

  const message = [
    '📋 *SOLICITAÇÃO DE PEDIDO – LabPrime*', '',
    '👤 *Dados do cliente*',
    `Nome: ${personal.nome}`,
    `Telefone: +${personal.dialCode} ${personal.telefone}`,
    `E-mail: ${personal.email}`,
    docLine, '',
    '📍 *Endereço de entrega*', addressLine, '',
    '🧪 *Itens solicitados*', itemLines, '',
    `📦 Subtotal: ${formatBRL(subtotal)}`,
    `🚚 Frete: ${shipping === 0 ? 'Grátis' : formatBRL(shipping)}`,
    `💰 *Total: ${formatBRL(total)}*`, '',
    '_Pedido enviado pelo sistema LabPrime para validação._',
  ].join('\n');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const LoadingSpinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ['Dados pessoais', 'Endereço', 'Revisão'];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const idx = i + 1; const done = idx < current; const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-navy-900 text-white' : 'bg-haze-200 text-mute'}`}>
                {done ? '✓' : idx}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${active ? 'text-navy-900' : 'text-mute-light'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`mb-4 h-px w-12 transition-colors ${done ? 'bg-emerald-300' : 'bg-haze-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────
function OrderSummary({ items, subtotal }) {
  const shipping = subtotal >= 500 ? 0 : 35;
  return (
    <div className="card sticky top-24 p-5">
      <h3 className="mb-4 text-sm font-semibold text-navy-900">Resumo do pedido</h3>
      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-navy-50 text-[10px] font-bold text-navy-600">{item.quantity}x</span>
            <div className="flex flex-1 justify-between gap-2">
              <p className="line-clamp-2 text-xs text-navy-900">{item.name}</p>
              <p className="text-xs font-semibold text-navy-900 whitespace-nowrap">{formatBRL(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="section-divider mt-4 space-y-2 pt-4 text-xs text-mute">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>{shipping === 0 ? 'Grátis' : formatBRL(shipping)}</span>
        </div>
        <div className="flex justify-between pt-2 text-sm font-bold text-navy-900 border-t border-haze-200">
          <span>Total</span><span>{formatBRL(subtotal + shipping)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Searchable phone country dropdown ───────────────────────────────────────
function PhoneCountrySelect({ value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const containerRef          = useRef(null);
  const inputRef              = useRef(null);

  const selected = PHONE_COUNTRIES.find((c) => c.dial === value) ?? PHONE_COUNTRIES[0];

  const filtered = query.trim()
    ? PHONE_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.dial.includes(query.replace(/\D/g, ''))
      )
    : PHONE_COUNTRIES;

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex-shrink-0" style={{ minWidth: '110px' }}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className="field flex items-center gap-1.5 px-3 text-sm font-medium"
      >
        <span>{selected.flag}</span>
        <span>+{selected.dial}</span>
        <span className="ml-auto text-mute text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-haze-200 bg-white shadow-lift overflow-hidden">
          <div className="border-b border-haze-200 p-2">
            <input
              ref={inputRef}
              className="w-full rounded-lg border border-haze-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              placeholder="Buscar país ou código…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-xs text-mute">Nenhum resultado</li>
            )}
            {filtered.map((c) => (
              <li key={c.code + c.dial}>
                <button
                  type="button"
                  onClick={() => { onChange(c.dial); setOpen(false); setQuery(''); }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-haze
                    ${c.dial === value ? 'bg-brand/5 font-semibold text-brand' : 'text-navy-900'}`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-mute font-mono">+{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Personal data ────────────────────────────────────────────────────
function StepPersonal({ data, onChange, onNext }) {
  const isBR          = data.dialCode === '55';
  const selectedPhone = PHONE_COUNTRIES.find((c) => c.dial === data.dialCode) ?? PHONE_COUNTRIES[0];
  const cpfDigits     = data.documento.replace(/\D/g, '');

  // Document validation (CPF mandatory for BR)
  const docValid = data.docSkipped
    ? data.docMotivo.trim().length >= 10
    : isBR
    ? isCPFValid(data.documento)
    : data.documento.trim().length >= 3;

  const valid =
    data.nome.trim() &&
    data.email.includes('@') &&
    isPhoneValid(data.telefone, data.dialCode) &&
    docValid;

  const cpfHint = !data.docSkipped && isBR && cpfDigits.length > 0 && !isCPFValid(data.documento)
    ? `${11 - cpfDigits.length} dígito(s) faltando`
    : '';

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Nome completo</label>
        <input className="field" placeholder="Dr. Ana Beatriz Oliveira" value={data.nome}
          onChange={(e) => onChange('nome', e.target.value)} />
      </div>

      <div>
        <label className="label">E-mail</label>
        <input type="email" className="field" placeholder="contato@laboratorio.com.br" value={data.email}
          onChange={(e) => onChange('email', e.target.value)} />
      </div>

      <div>
        <label className="label">Telefone / WhatsApp</label>
        <div className="flex gap-2">
          <PhoneCountrySelect
            value={data.dialCode}
            onChange={(dial) => { onChange('dialCode', dial); onChange('telefone', ''); }}
          />
          <input
            className="field flex-1"
            placeholder={data.dialCode === '55' ? '(11) 99999-0000' : data.dialCode === '1' ? '(555) 123-4567' : data.dialCode === '44' ? '07700 900000' : 'Número…'}
            value={data.telefone}
            onChange={(e) => onChange('telefone', formatPhoneByCountry(e.target.value, data.dialCode))}
            inputMode="tel"
          />
        </div>
        {data.telefone && !isPhoneValid(data.telefone, data.dialCode) && (
          <p className="mt-1 text-xs text-amber-600">Mínimo {selectedPhone.min} dígitos para {selectedPhone.name}</p>
        )}
        {data.telefone && isPhoneValid(data.telefone, data.dialCode) && (
          <p className="mt-1 text-xs text-emerald-600">✓ +{data.dialCode} {data.telefone}</p>
        )}
      </div>

      {/* Documento */}
      <div>
        <div className="flex items-center justify-between">
          <label className="label">
            {isBR ? (
              <>CPF <span className="text-red-500">*</span></>
            ) : (
              <>Documento de identificação</>
            )}
          </label>
          <button type="button"
            onClick={() => { onChange('docSkipped', !data.docSkipped); onChange('documento', ''); onChange('docMotivo', ''); }}
            className="text-xs text-mute underline-offset-2 hover:text-navy-900 hover:underline transition-colors">
            {data.docSkipped ? '← Informar documento' : 'Prefiro não informar'}
          </button>
        </div>

        {!data.docSkipped ? (
          <>
            <input
              className={`field ${cpfHint ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/10' : ''}`}
              placeholder={isBR ? '000.000.000-00' : 'Passaporte, National ID, RG…'}
              value={data.documento}
              onChange={(e) => onChange('documento', isBR ? formatCPF(e.target.value) : e.target.value)}
              inputMode={isBR ? 'numeric' : 'text'}
            />
            {cpfHint && <p className="mt-1 text-xs text-amber-600">{cpfHint}</p>}
            {!cpfHint && isBR && isCPFValid(data.documento) && (
              <p className="mt-1 text-xs text-emerald-600">✓ CPF válido</p>
            )}
            {!isBR && data.documento.trim().length >= 3 && (
              <p className="mt-1 text-xs text-emerald-600">✓ Documento registrado</p>
            )}
          </>
        ) : (
          <div className="space-y-1">
            <textarea
              className="field min-h-[72px] resize-none text-sm"
              placeholder="Por favor, informe o motivo para prosseguir com o pedido…"
              value={data.docMotivo}
              onChange={(e) => onChange('docMotivo', e.target.value)}
              maxLength={200}
            />
            <div className="flex justify-between">
              {data.docMotivo.trim().length > 0 && data.docMotivo.trim().length < 10 && (
                <p className="text-xs text-amber-600">{10 - data.docMotivo.trim().length} chars restantes</p>
              )}
              {data.docMotivo.trim().length >= 10 && (
                <p className="text-xs text-emerald-600">✓ Motivo registrado</p>
              )}
              <p className="ml-auto text-xs text-mute">{data.docMotivo.length}/200</p>
            </div>
          </div>
        )}
      </div>

      <button onClick={onNext} disabled={!valid} className="btn-primary w-full py-3">
        Continuar para endereço
      </button>
    </div>
  );
}

// ─── Step 2: Address ──────────────────────────────────────────────────────────
function StepAddress({ data, onChange, onNext, onBack }) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError]     = useState('');
  const isBR = data.country === 'BR';

  const handleCEP = useCallback(async (raw) => {
    const cep = formatCEP(raw); onChange('cep', cep); setCepError('');
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) { setCepError('CEP não encontrado.'); }
      else { onChange('logradouro', json.logradouro ?? ''); onChange('bairro', json.bairro ?? ''); onChange('cidade', json.localidade ?? ''); onChange('estado', json.uf ?? ''); }
    } catch { setCepError('Erro ao consultar CEP.'); }
    finally { setCepLoading(false); }
  }, [onChange]);

  const handleCountry = (code) => {
    onChange('country', code);
    ['cep','logradouro','numero','complemento','bairro','cidade','estado','postalCode'].forEach((k) => onChange(k, ''));
    setCepError('');
  };

  const validBR   = isBR && data.cep.replace(/\D/g, '').length === 8 && data.logradouro && data.cidade && data.numero;
  const validIntl = !isBR && data.logradouro.trim() && data.cidade.trim();
  const valid     = validBR || validIntl;
  const selectedDelivery = DELIVERY_COUNTRIES.find((c) => c.code === data.country);

  return (
    <div className="space-y-5">
      <div>
        <label className="label">País de entrega</label>
        <select className="field cursor-pointer" value={data.country} onChange={(e) => handleCountry(e.target.value)}>
          {DELIVERY_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
      </div>

      {isBR ? (
        <>
          <div>
            <label className="label">CEP</label>
            <div className="relative">
              <input className={`field pr-10 ${cepError ? 'border-red-400' : ''}`} placeholder="00000-000"
                value={data.cep} onChange={(e) => handleCEP(e.target.value)} maxLength={9} inputMode="numeric" />
              {cepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mute"><LoadingSpinner /></span>}
            </div>
            {cepError && <p className="mt-1 text-xs text-red-500">{cepError}</p>}
            {!cepError && data.cidade && <p className="mt-1 text-xs text-emerald-600">✓ {data.cidade} – {data.estado}</p>}
          </div>
          <div>
            <label className="label">Logradouro</label>
            <input className="field" placeholder="Rua, Av., Al…" value={data.logradouro} onChange={(e) => onChange('logradouro', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Número</label><input className="field" placeholder="123" value={data.numero} onChange={(e) => onChange('numero', e.target.value)} /></div>
            <div><label className="label">Complemento</label><input className="field" placeholder="Sala, Bloco…" value={data.complemento} onChange={(e) => onChange('complemento', e.target.value)} /></div>
          </div>
          <div><label className="label">Bairro</label><input className="field" placeholder="Bairro" value={data.bairro} onChange={(e) => onChange('bairro', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><label className="label">Cidade</label><input className="field" placeholder="São Paulo" value={data.cidade} onChange={(e) => onChange('cidade', e.target.value)} /></div>
            <div><label className="label">UF</label><input className="field" placeholder="SP" maxLength={2} value={data.estado} onChange={(e) => onChange('estado', e.target.value.toUpperCase().slice(0, 2))} /></div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-xs text-navy-700">
            📦 Entrega para <strong>{selectedDelivery?.name ?? data.country}</strong> — frete internacional sob consulta após confirmação.
          </div>
          <div><label className="label">Street address</label><input className="field" placeholder="123 Lab Avenue, Suite 4" value={data.logradouro} onChange={(e) => onChange('logradouro', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nº / Unit</label><input className="field" placeholder="Apt 2B" value={data.numero} onChange={(e) => onChange('numero', e.target.value)} /></div>
            <div><label className="label">Address line 2 <span className="text-mute text-[10px]">(opcional)</span></label><input className="field" placeholder="Floor, Building…" value={data.complemento} onChange={(e) => onChange('complemento', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">City</label><input className="field" placeholder="London" value={data.cidade} onChange={(e) => onChange('cidade', e.target.value)} /></div>
            <div><label className="label">State / Province</label><input className="field" placeholder="England" value={data.estado} onChange={(e) => onChange('estado', e.target.value)} /></div>
          </div>
          <div><label className="label">ZIP / Postal Code <span className="text-mute text-[10px]">(se aplicável)</span></label><input className="field" placeholder="SW1A 1AA" value={data.postalCode ?? ''} onChange={(e) => onChange('postalCode', e.target.value)} /></div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-ghost flex-shrink-0 px-4"><ChevronLeft /></button>
        <button onClick={onNext} disabled={!valid} className="btn-primary flex-1 py-3">Revisar pedido</button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & confirm ─────────────────────────────────────────────────
function StepReview({ personal, address, items, subtotal, onConfirm, onBack, loading, onWhatsApp }) {
  const shipping   = subtotal >= 500 ? 0 : 35;
  const isBR       = address.country === 'BR';
  const countryObj = DELIVERY_COUNTRIES.find((c) => c.code === address.country);

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute">Dados pessoais</p>
        <div className="mt-3 space-y-1 text-sm text-navy-900">
          <p className="font-medium">{personal.nome}</p>
          <p className="text-mute">{personal.email}</p>
          <p className="text-mute">+{personal.dialCode} {personal.telefone}</p>
          {personal.docSkipped
            ? <p className="text-xs text-amber-600 italic">Doc. não informado — {personal.docMotivo}</p>
            : personal.documento && <p className="text-mute">{personal.dialCode === '55' ? 'CPF' : 'Doc.'}: {personal.documento}</p>
          }
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute">Endereço de entrega</p>
        <div className="mt-3 text-sm text-navy-900">
          {isBR ? (
            <>
              <p className="font-medium">{address.logradouro}, {address.numero}{address.complemento && ` – ${address.complemento}`}</p>
              <p className="text-mute">{address.bairro} · {address.cidade}/{address.estado} · CEP {address.cep}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{address.logradouro}{address.numero ? `, ${address.numero}` : ''}{address.complemento && ` – ${address.complemento}`}</p>
              <p className="text-mute">{address.cidade}{address.estado && `, ${address.estado}`}{address.postalCode && ` · ${address.postalCode}`}</p>
              <p className="text-mute">{countryObj?.flag} {countryObj?.name ?? address.country}</p>
            </>
          )}
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute">Itens do pedido</p>
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 text-sm">
              <span className="text-navy-900">{item.quantity}× {item.name}</span>
              <span className="font-semibold text-navy-900 whitespace-nowrap">{formatBRL(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="section-divider mt-3 pt-3 text-sm">
          <div className="flex justify-between font-bold text-navy-900">
            <span>Total c/ frete</span><span>{formatBRL(subtotal + shipping)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-xs text-navy-700">
        <p className="font-semibold">Forma de pagamento</p>
        <p className="mt-1 text-mute">Você receberá instruções de pagamento por e-mail após a confirmação. Aceitamos PIX, Boleto Bancário e Cartão de Crédito em até 12×.</p>
      </div>

      <div className="space-y-3 pt-2">
        <button onClick={onWhatsApp}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1ebe5a] hover:shadow-md active:scale-[0.98]">
          <WhatsAppIcon />
          Enviar Solicitação para Validação via WhatsApp
        </button>
        <div className="flex gap-3">
          <button onClick={onBack} className="btn-ghost flex-shrink-0 px-4"><ChevronLeft /></button>
          <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1 py-3">
            {loading ? <><LoadingSpinner /> Processando…</> : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CheckoutForm (main) ──────────────────────────────────────────────────────
export default function CheckoutForm({ onSuccess, onBack }) {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep]               = useState(1);
  const [submitting, setSubmitting]   = useState(false);

  const [personal, setPersonal] = useState({
    nome: '', email: '', telefone: '', dialCode: '55',
    documento: '', docSkipped: false, docMotivo: '',
  });
  const [address, setAddress] = useState({
    country: 'BR',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', postalCode: '',
  });

  const handlePersonal = (k, v) => setPersonal((p) => ({ ...p, [k]: v }));
  const handleAddress  = (k, v) => setAddress((a)  => ({ ...a, [k]: v }));

  async function handleConfirm() {
    setSubmitting(true);
    const shipping = subtotal >= 500 ? 0 : 35;

    // Run order processing + email dispatch in parallel
    const [, emailResult] = await Promise.all([
      new Promise((r) => setTimeout(r, 1400)),               // simulate order API
      mockSendConfirmationEmail(personal.email, { personal, address, items, subtotal }), // email mock
    ]);

    const orderPayload = {
      personal, address,
      items: [...items], subtotal, shipping,
      total: subtotal + shipping,
      emailSent: emailResult?.ok ?? false,
    };
    clearCart();
    onSuccess?.(orderPayload);
  }

  function handleWhatsApp() {
    const url = buildWhatsAppURL(personal, address, items, subtotal);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="min-h-screen bg-haze py-10">
      <div className="mx-auto max-w-5xl px-6">
        <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-navy-900">
          <ChevronLeft /> Voltar ao catálogo
        </button>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="card p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Finalizar pedido</h2>
              <StepIndicator current={step} />
            </div>
            {step === 1 && <StepPersonal data={personal} onChange={handlePersonal} onNext={() => setStep(2)} />}
            {step === 2 && <StepAddress  data={address}  onChange={handleAddress}  onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && (
              <StepReview
                personal={personal} address={address} items={items} subtotal={subtotal}
                onConfirm={handleConfirm} onBack={() => setStep(2)}
                loading={submitting} onWhatsApp={handleWhatsApp}
              />
            )}
          </div>
          <OrderSummary items={items} subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
