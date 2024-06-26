<template>
	<div class="v-table" :style="styles" :class="{ loading }">

	
		<table>
			<table-header
				:headers.sync="_headers"
				:sort.sync="_sort"
				:show-select="showSelect"
				:show-resize="showResize"
				:some-items-selected="someItemsSelected"
				:all-items-selected="allItemsSelected"
				:fixed="fixedHeader"
				:show-manual-sort="showManualSort"
				@toggle-select-all="onToggleSelectAll"
			>
				<template v-for="header in _headers" #[`header.${header.value}`]>
					<slot :header="header" :name="`header.${header.value}`" />
				</template>
			</table-header>
			<thead v-if="loading" class="loading-indicator">
				<th :colspan="_headers.length">
					<v-progress-linear indeterminate v-if="loading" :height="2" />
				</th>
			</thead>
			<tbody v-if="loading && items.length === 0">
				<tr class="loading-text">
					<td :colspan="_headers.length">{{ loadingText }}</td>
				</tr>
			</tbody>
			<draggable
				v-else
				v-model="_items"
				tag="tbody"
				handle=".drag-handle"
				:disabled="_sort.by !== '$manual'"
				@end="onEndDrag"
			>
				<table-row
					v-for="item in _items"
					:key="item[itemKey]"
					:headers="_headers"
					:item="item"
					:show-select="showSelect"
					:show-manual-sort="showManualSort"
					:is-selected="getSelectedState(item)"
					:subdued="loading"
					:sorted-manually="_sort.by === '$manual'"
					:has-click-listener="hasRowClick"
					:height="rowHeight"
					@click="hasRowClick ? $emit('click:row', item) : null"
					@item-selected="onItemSelected"
				>
					<template v-for="header in _headers" #[`item.${header.value}`]>
						<slot :item="item" :name="`item.${header.value}`" />
					</template>
				</table-row>
			</draggable>
		</table>
	</div>
</template>

<script lang="ts">
import { VNode } from 'vue';
import { createComponent, computed, ref, watch, Ref, PropType } from '@vue/composition-api';
import { Header, HeaderRaw, ItemSelectEvent, Sort } from './types';
import TableHeader from './_table-header.vue';
import TableRow from './_table-row.vue';
import { sortBy, clone, mapValues, forEach, pick } from 'lodash';
const draggable = require('vuedraggable');

const { i18n } = require('@/lang/');

const HeaderDefaults: Header = {
	text: '',
	value: '',
	align: 'left',
	sortable: true,
	width: null
};

export default createComponent({
	components: {
		TableHeader,
		TableRow,
		draggable
	},
	model: {
		prop: 'selection',
		event: 'select'
	},
	props: {
		headers: {
			type: Array as PropType<HeaderRaw[]>,
			required: true
		},
		items: {
			type: Array as PropType<object[]>,
			required: true
		},
		itemKey: {
			type: String,
			default: 'id'
		},
		sort: {
			type: Object as PropType<Sort>,
			default: null
		},
		showSelect: {
			type: Boolean,
			default: false
		},
		showResize: {
			type: Boolean,
			default: false
		},
		showManualSort: {
			type: Boolean,
			default: false
		},
		selection: {
			type: Array as PropType<any[]>,
			default: () => []
		},
		fixedHeader: {
			type: Boolean,
			default: false
		},
		height: {
			type: Number,
			default: null
		},
		loading: {
			type: Boolean,
			default: false
		},
		loadingText: {
			type: String,
			default: i18n.t('loading')
		},
		serverSort: {
			type: Boolean,
			default: false
		},
		rowHeight: {
			type: Number,
			default: 48
		}
	},
	setup(props, { slots, emit, listeners }) {
		const _headers = computed({
			get: () => {
				return props.headers.map((header: HeaderRaw) => ({
					...HeaderDefaults,
					...header
				}));
			},
			set: (newHeaders: Header[]) => {
				emit(
					'update:headers',
					// We'll return the original headers with the updated values, so we don't stage
					// all the default values
					newHeaders.map((header, index) => {
						const keysThatArentDefault: string[] = [];

						forEach(header, (value, key: string) => {
							const objKey = key as keyof Header;

							if (value !== HeaderDefaults[objKey]) {
								keysThatArentDefault.push(key);
							}
						});

						return pick(header, keysThatArentDefault);
					})
				);
			}
		});

		// In case the sort prop isn't used, we'll use this local sort state as a fallback.
		// This allows the table to allow inline sorting on column ootb without the need for
		const _localSort = ref<Sort>({
			by: null,
			desc: false
		});

		const _sort = computed({
			get: () => props.sort || _localSort.value,
			set: (newSort: Sort) => {
				emit('update:sort', newSort);
				_localSort.value = newSort;
			}
		});

		const _items = computed({
			get: () => {
				if (props.serverSort === true || _sort.value.by === '$manual') {
					return props.items;
				}

				if (_sort.value.by === null) return props.items;

				const itemsSorted = sortBy(props.items, [_sort.value.by]);
				if (_sort.value.desc === true) return itemsSorted.reverse();
				return itemsSorted;
			},
			set: (value: object[]) => {
				emit('update:items', value);
			}
		});

		const allItemsSelected = computed<boolean>(() => {
			return props.selection.length === props.items.length;
		});

		const someItemsSelected = computed<boolean>(() => {
			return props.selection.length > 0 && allItemsSelected.value === false;
		});

		type Styles = {
			height?: string;
		};

		const styles = computed<object>(() => {
			const styles: Styles = {};

			if (props.height) {
				styles.height = props.height + 'px';
			}

			return styles;
		});

		const hasRowClick = computed<boolean>(() => listeners.hasOwnProperty('click:row'));

		return {
			_headers,
			_items,
			_sort,
			allItemsSelected,
			getSelectedState,
			onItemSelected,
			onToggleSelectAll,
			someItemsSelected,
			styles,
			onEndDrag,
			hasRowClick
		};

		function onItemSelected(event: ItemSelectEvent) {
			emit('item-selected', event);

			const selection: any[] = clone(props.selection);

			if (event.value === true) {
				selection.push(event.item);
			} else {
				const itemIndex: number = selection.findIndex(
					(item: any) => item[props.itemKey] === event.item[props.itemKey]
				);

				selection.splice(itemIndex, 1);
			}

			emit('select', selection);
		}

		function getSelectedState(item: any) {
			const selectedKeys = props.selection.map((item: any) => item[props.itemKey]);
			return selectedKeys.includes(item[props.itemKey]);
		}

		function onToggleSelectAll(value: boolean) {
			if (value === true) {
				emit('select', clone(props.items));
			} else {
				emit('select', []);
			}
		}

		interface VueDraggableDropEvent extends CustomEvent {
			oldIndex: number;
			newIndex: number;
		}

		function onEndDrag(event: VueDraggableDropEvent) {
			emit('drop', { oldIndex: event.oldIndex, newIndex: event.newIndex });
		}
	}
});
</script>

<style lang="scss" scoped>
.v-table {
	position: relative;
	overflow: auto;

	table {
		border-spacing: 0;
		width: 100%;
		table-layout: fixed;
	}

	&.loading {
		table {
			pointer-events: none;
		}

		.loading-indicator {
			height: auto;
			padding: 0;
			border: none;

			th {
				padding: 0;
			}
		}

		.loading-text {
			td {
				padding: 16px;
			}
			color: var(--input-placeholder-color);
			text-align: center;
		}
	}

	::v-deep {
		.align-left {
			text-align: left;
		}

		.align-center {
			text-align: center;
		}

		.align-right {
			text-align: right;
		}

		.sortable-ghost {
			.cell {
				background-color: var(--highlight);
			}
		}
	}
}
</style>
