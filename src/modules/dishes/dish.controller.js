import * as dishService from './dish.service.js';
 
export async function create(req, res) {
  try {
    const { restaurantId } = req.params;
    const { name, description, price } = req.body;
 
    // Validação básica (o PDF pede validar nome, preço e identificadores)
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nome do prato é obrigatório' });
    }
    if (price === undefined || price === null || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Preço inválido' });
    }
    if (!Number.isInteger(Number(restaurantId))) {
      return res.status(400).json({ error: 'Restaurante inválido' });
    }
 
    const dish = await dishService.createDish(restaurantId, {
      name: String(name).trim(),
      description: typeof description === 'string' ? description.trim() : '',
      price: Number(price)
    }, req.user.id);
 
    return res.status(201).json(dish);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : 'Erro interno ao cadastrar prato'
    });
  }
}
 
export async function list(req, res) {
  try {
    const { restaurantId } = req.params;
    const dishes = await dishService.listDishes(restaurantId);
    return res.json(dishes);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar pratos' });
  }
}
 
export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
 
    const dish = await dishService.uploadDishImage(req.params.dishId, req.file.buffer, req.user.id);
    return res.json(dish);
  } catch (error) {
    // Falha no upload NÃO apaga o prato: ele continua cadastrado (operação secundária)
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : 'Erro ao processar imagem'
    });
  }
}