import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Title, Label, Input, IconObject, Button, Select, Loader } from 'Component';
import { UtilObject, UtilCommon, UtilRouter, I, C, translate, keyboard, Preview } from 'Lib';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	name: string;
	iconEmoji: string;
	iconOption: number;
	iconImage: string;
	useCase: I.Usecase;
	isLoading: boolean;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings, State> {

	refName: any = null;

	state = {
		name: '',
		iconEmoji: '',
		iconOption: UtilCommon.rand(1, Constant.iconCnt),
		iconImage: '',
		useCase: 0,
		isLoading: false,
	};

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { name, iconOption, iconEmoji, iconImage, useCase, isLoading } = this.state;
		const { onSpaceTypeTooltip } = this.props;
		const space = {
			layout: I.ObjectLayout.SpaceView,
			name,
			iconOption,
			iconEmoji,
			iconImage,
		};
		const options = this.getUsecaseOptions();

		return (
			<React.Fragment>

				{isLoading ? <Loader /> : ''}

				<Title text={translate('popupSettingsSpaceCreateTitle')} />

				<div className="spaceHeader">
					<div className="iconWrapper">
						<IconObject
							id="spaceIcon"
							size={96}
							object={space}
							forceLetter={true}
							canEdit={false}
							menuParam={{ horizontal: I.MenuDirection.Center }}
							onSelect={this.onSelect}
						/>
					</div>

					<div className="headerContent">
						<div className="name">
							<Input
								ref={ref => this.refName = ref}
								value=""
								onKeyDown={this.onKeyDown}
								onKeyUp={this.onKeyUp}
								placeholder={UtilObject.defaultName('Page')}
							/>
						</div>

						<Label
							className="spaceType"
							text={translate('popupSettingsSpaceIndexSpaceTypePersonal')}
							onMouseEnter={onSpaceTypeTooltip}
							onMouseLeave={e => Preview.tooltipHide(false)}
						/>
					</div>
				</div>

				<div className="sections">
					<div className="section">
						<div className="sectionContent">
							<div className="item">
								<div className="sides">
									<div className="side left">
										<Title text={translate('popupSettingsSpaceCreateUsecaseTitle')} />
										<Label text={translate('popupSettingsSpaceCreateUsecaseLabel')} />
									</div>
									<div className="side right">
										<Select 
											id="select-usecase"
											value={String(useCase || '')}
											options={options}
											onChange={id => this.setState({ useCase: Number(id) || 0 })}
											menuParam={{
												width: 360,
												horizontal: I.MenuDirection.Center,
												className: 'withFullDescripion',
												data: { noVirtualisation: true, noScroll: true }
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="buttons">
					<Button text={translate('commonCreate')} onClick={this.onSubmit} />
				</div>

			</React.Fragment>
		);
	};

	componentDidMount (): void {
		window.setTimeout(() => this.refName?.focus(), 15);
	};

	componentWillUnmount(): void {
		menuStore.closeAll([ 'select', 'searchObject' ]);	
	};

	onSelect (iconEmoji: string) {
		this.setState({ iconEmoji, iconImage: '' });
	};

	onKeyDown (e: any, v: string) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onSubmit();
		});
	};

	onKeyUp (e: any, v: string) {
		this.setState({ name: this.checkName(v) });
	};

	onSubmit () {
		const { close } = this.props;
		const { isLoading } = this.state;

		if (isLoading) {
			return;
		};

		this.setState({ isLoading: true });

		C.WorkspaceCreate(this.state,  this.state.useCase, (message: any) => {
			this.setState({ isLoading: false });
			UtilRouter.switchSpace(message.objectId, '', () => close());
		});
	};

	checkName (v: string): string {
		if ([ UtilObject.defaultName('Space'), UtilObject.defaultName('Page') ].includes(v)) {
			v = '';
		};
		return v;
	};

	getUsecaseOptions () {
		let ret: any = [ 
			{ id: I.Usecase.Empty, icon: 'white_medium_square' },
		];

		ret = ret.concat(_.shuffle([
			{ id: I.Usecase.Personal, icon: 'postbox', },
			{ id: I.Usecase.Notes, icon: 'memo' },
			{ id: I.Usecase.Knowledge, icon: 'books' },
			{ id: I.Usecase.Strategic, icon: 'bulb' },
        ]));

		return ret.map((it: any) => ({
			...it,
			name: translate(`usecase${it.id}Title`),
			description: translate(`usecase${it.id}Label`),
			withDescription: true,
			iconSize: 40,
			object: { iconEmoji: `:${it.icon}:` }
		}));
	};

});

export default PopupSettingsSpaceIndex;