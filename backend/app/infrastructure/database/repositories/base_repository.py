from typing import TypeVar, Generic, Type, Optional, List
from sqlmodel import Session, SQLModel, select

# Definimos tipos genéricos para el Modelo de DB y la Entidad de Dominio
TModel = TypeVar("TModel", bound=SQLModel)

class BaseRepository(Generic[TModel]):
    def __init__(self, session: Session, model_class: Type[TModel]):
        self.session = session
        self.model_class = model_class

    def _save(self, db_model: TModel) -> TModel:
        if hasattr(db_model, 'id') and db_model.id:
            existing = self.session.get(self.model_class, db_model.id)
            if existing:
                data = db_model.model_dump(exclude={"id"})
                for key, value in data.items():
                    setattr(existing, key, value)
                db_model = existing

        self.session.add(db_model)
        self.session.commit()
        self.session.refresh(db_model)
        return db_model

    def _get_by_id(self, id: int) -> Optional[TModel]:
        return self.session.get(self.model_class, id)

    def _list_all(self, skip: int = 0, limit: int = 100) -> List[TModel]:
        statement = select(self.model_class).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def _delete(self, id: int) -> None:
        db_model = self.session.get(self.model_class, id)
        if db_model:
            self.session.delete(db_model)
            self.session.commit()
