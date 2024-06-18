import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { ObjectName, IconObject, DropTarget, ObjectCover } from 'Component';
import { blockStore, menuStore } from 'Store';
import { I, S, UtilObject, keyboard, analytics, UtilSpace, Dataview } from 'Lib';

const Constant = require('json/constant.json');

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	isEditing?: boolean;
	hideIcon?: boolean;
};

const WidgetBoardItem = observer(class WidgetBoardItem extends React.Component<Props> {

	node = null;
	frame = 0;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onContext = this.onContext.bind(this);
	};

	render () {
		const { subId, id, block, isEditing, hideIcon } = this.props;
		const rootId = keyboard.getRootId();
		const object = S.Detail.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, restrictions } = object;
		const allowedDetails = blockStore.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const iconKey = `widget-icon-${block.id}-${id}`;
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const cn = [ 'item' ];
		const cover = this.getCoverObject();

		if (cover) {
			cn.push('withCover');
		};

		let icon = null;
		if (!hideIcon) {
			icon = (
				<IconObject 
					id={iconKey}
					key={iconKey}
					object={object} 
					size={16} 
					iconSize={16}
					canEdit={!isReadonly && !isArchived && allowedDetails} 
					menuParam={{ 
						className: 'fixed',
						classNameWrap: 'fromSidebar',
					}}
				/>
			);
		};

		let inner = (
			<div className="inner" onMouseDown={this.onClick}>
				<ObjectCover object={cover} />

				<div className="info">
					{icon}
					<ObjectName object={object} />
				</div>
			</div>
		);

		if (canDrop) {
			inner = (
				<DropTarget
					cacheKey={[ block.id, object.id ].join('-')}
					id={object.id}
					rootId={rootId}
					targetContextId={object.id}
					dropType={I.DropType.Menu}
					canDropMiddle={true}
				>
					{inner}
				</DropTarget>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				className={cn.join(' ')}
				onContextMenu={this.onContext}
			>
				{inner}
			</div>
		);
	};

	componentDidMount (): void {
		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	onClick (e: React.MouseEvent) {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		UtilObject.openEvent(e, this.getObject());
		analytics.event('OpenSidebarObject');
	};

	getObject () {
		const { subId, id, } = this.props;
		return S.Detail.get(subId, id);
	};

	onContext (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const { subId, id, getView } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const canWrite = UtilSpace.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const node = $(this.node);
		const menuParam: any = {
			element: node,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetX: node.outerWidth(true),
			vertical: I.MenuDirection.Center,
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ id ],
				subId,
			},
		};

		menuStore.open('dataviewContext', menuParam);
	};

	getCoverObject (): any {
		const { getView, subId } = this.props;
		const view = getView();

		return view ? Dataview.getCoverObject(subId, this.getObject(), view.coverRelationKey) : null;
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			const node = $(this.node);
			const icon = node.find('.iconObject');

			icon.length ? node.addClass('withIcon') : node.removeClass('withIcon');
		});
	};

});

export default WidgetBoardItem;