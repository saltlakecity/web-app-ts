export default defineNuxtPlugin(() => {
  const { hash } = location
  const router = useRouter()
  
  // If vue-router broke hash on init, restore it back.
  // See https://github.com/deptyped/vue-telegram/issues/18
  let needFixHash = router.currentRoute.value.hash !== hash
  if (needFixHash) {
    router.afterEach(() => {
      if (needFixHash) {
        location.hash = hash
        needFixHash = false
      }
    })
  }

  // Переопределяем scrollBehavior для работы с Telegram Mini App
  router.options.scrollBehavior = (to, from, savedPosition) => {
    // Игнорируем hash если это tgWebAppData от Telegram
    if (to.hash && to.hash.startsWith('#tgWebAppData')) {
      return
    }
    
    // Восстанавливаем сохраненную позицию при навигации назад
    if (savedPosition) {
      return savedPosition
    }
    
    // Скроллим к якорю если он есть
    if (to.hash) {
      return { 
        el: to.hash, 
        behavior: 'smooth',
        top: 0
      }
    }
    
    // По умолчанию скроллим наверх
    return { top: 0 }
  }
})

