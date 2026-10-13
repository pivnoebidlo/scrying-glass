// Порядок плиток, заданный мастером перетаскиванием: портреты, монстры, фоны, раздатка. Ключ — группа (папка),
// значение — id плиток (пути картинок, id карточек) по порядку. Файлы на диске не меняются.
import { defineModule } from '../../shared/module';

export interface OrderState {
  groups: Record<string, string[]>;
}

const initialState: OrderState = { groups: {} };

export default defineModule({
  id: 'order',
  persist: true,
  initialState,

  actions: {
    // Новый порядок группы целиком.
    set(s, { group, ids }: { group: string; ids: string[] }) {
      return { ...s, groups: { ...s.groups, [group]: ids } };
    },
  },
});
