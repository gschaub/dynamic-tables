/* External dependencies */
import { CheckIcon, XIcon } from '@phosphor-icons/react';

export function StatusIcon({ checked, className, size = 24 }) {
	const Icon = checked ? CheckIcon : XIcon;
	const backgroundColor = checked ? '#2f9e44' : '#d64545';
	const label = checked ? 'Checked' : 'Unchecked';
	const glyphSize = Math.max(12, size - 6);

	return (
		<span
			className={className}
			role="img"
			aria-label={label}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: size,
				height: size,
				borderRadius: '999px',
				backgroundColor,
				color: '#fff',
				lineHeight: 0,
				flexShrink: 0,
			}}
		>
			<Icon size={glyphSize} weight="bold" aria-hidden="true" />
		</span>
	);
}

export function CartoonCheckboxIcon({ checked, className, scale = 1 }) {
	const stroke = checked ? '#16a34a' : '#ef3340';
	const baseSize = 52;
	const size = baseSize * scale;

	return checked ? (
		<svg className={className} width={size} height={size} viewBox="0 0 52 52" aria-hidden="true">
			<path
				d={`
					M13.8 13.4
					L36.7 12.6
					Q40.4 12.4 41.7 15.5
					Q42.3 17.0 42.3 19.1
					L42.3 33.9
					Q42.3 37.5 40.3 39.4
					Q38.5 41.1 35.5 41.2
					L15.0 41.9
					Q11.4 42.0 9.5 40.0
					Q7.8 38.2 7.7 34.8
					L7.6 19.1
					Q7.5 15.0 10.2 13.9
					Q11.5 13.4 13.8 13.4
					Z
				`}
				fill="#fff"
			/>
			<path
				d={`
					M32.3 13.2
					C25.8 12.9 19.4 13.1 13.2 13.7
					C10.1 14.0 8.9 15.7 8.9 18.4
					L9.0 35.0
					C9.1 38.6 11.1 40.4 14.6 40.4
					L35.1 39.8
					C38.8 39.7 41.3 37.8 41.3 34.5
					L41.3 28.1
				`}
				fill="none"
				stroke={stroke}
				strokeWidth="4.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M18.2 28.9 L23.9 34.0 L42.7 15.5"
				fill="none"
				stroke={stroke}
				strokeWidth="8.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	) : (
		<svg className={className} width={size} height={size} viewBox="0 0 52 52" aria-hidden="true">
			<path
				d={`
					M14.1 13.0
					L37.1 11.9
					Q40.8 11.7 42.3 14.7
					Q43.0 16.2 43.1 18.4
					L43.7 34.8
					Q43.9 38.5 41.9 40.5
					Q40.1 42.2 36.9 42.4
					L15.7 43.2
					Q12.0 43.3 10.0 41.2
					Q8.2 39.3 8.1 35.8
					L7.7 18.3
					Q7.6 14.6 10.1 13.4
					Q11.4 13.0 14.1 13.0
					Z
				`}
				fill="#fff"
				stroke={stroke}
				strokeWidth="4.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M20.0 21.0 L31.4 32.2 M31.5 21.2 L20.1 32.0"
				fill="none"
				stroke={stroke}
				strokeWidth="8.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
