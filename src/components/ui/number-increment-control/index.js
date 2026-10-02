/* External dependencies */
import { Stack, InputLayout, IconButton } from '@wordpress/ui';
// import { plus, reset, chevronDownSmall, chevronUpSmall } from '@wordpress/icons';
import { plus, reset, chevronDown, chevronUp } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/* Internal dependencies */
import './style.scss';

export function NumberIncrementControl(props) {
	const { baseInteger, iconPair = 'plus-minus', reverseIcons = false, onClick } = props;
	const getIcons = (pair, reverseIcons) => {
		switch (pair) {
			case 'plus-minus': {
				return {
					iconIncrement: !reverseIcons ? plus : reset,
					iconDecrement: !reverseIcons ? reset : reset,
				};
			}
			case 'arrow-up-down': {
				return {
					iconIncrement: !reverseIcons ? chevronUp : chevronDown,
					iconDecrement: !reverseIcons ? chevronDown : chevronUp,
				};
			}
			default: {
				return {
					iconIncrement: !reverseIcons ? plus : reset,
					iconDecrement: !reverseIcons ? reset : plus,
				};
			}
		}
	};

	const { iconIncrement, iconDecrement } = getIcons(iconPair, reverseIcons);

	return (
		<InputLayout.Slot padding="minimal">
			<Stack direction="row" align="center" className="dtbk-increment-steppers">
				<IconButton
					className="dtbk-increment-steppers__button"
					type="button"
					label={__('Increment columns', 'dynamic-table-blocks')}
					icon={iconIncrement}
					size="small"
					variant="minimal"
					disabled={Number(baseInteger) >= 50}
					onClick={() => onClick(Number(baseInteger) + 1)}
				/>
				<span className="dtbk-increment-steppers__separator" aria-hidden="true">
					/
				</span>
				<IconButton
					className="dtbk-increment-steppers__button"
					type="button"
					label={__('Decrement columns', 'dynamic-table-blocks')}
					icon={iconDecrement}
					size="small"
					variant="minimal"
					disabled={Number(baseInteger) <= 1}
					onClick={() => onClick(Number(baseInteger) - 1)}
				/>
			</Stack>
		</InputLayout.Slot>
	);
}
