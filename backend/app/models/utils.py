# import time
# from sqlalchemy import inspect, text
# from sqlalchemy.exc import OperationalError

# def create_tables_if_needed(app, db, models):
#     max_retries = 15
#     retry_count = 0
    
#     while retry_count < max_retries:
#         try:
#             with app.app_context():
#                 # Try to connect to db
#                 db.engine.connect().close()
#                 print("Connected to db")
                
#                 inspector = inspect(db.engine)
                
#                 # Check all table is it exiting
#                 all_tables_exist = True
#                 for model in models:
#                     if not inspector.has_table(model.__tablename__):
#                         all_tables_exist = False
#                         break
                
#                 if all_tables_exist:
#                     break
                    
#                 existing_tables = []
#                 for model in models:
#                     if inspector.has_table(model.__tablename__):
#                         existing_tables.append(model.__tablename__)
                
#                 # Check all table and seq is it exiting, if true then delete all
#                 if existing_tables and len(existing_tables) < len(models):
#                     with db.engine.connect() as connection:
#                         # Clear all table
#                         for table_name in existing_tables:
#                             try:
#                                 connection.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
#                             except Exception as e:
#                                 print(f"Error on deleting table {table_name}: {e}")
                        
#                         # Clear all seq
#                         for model in models:
#                             table_name = model.__tablename__
#                             seq_name = f"{table_name}_id_seq"
#                             try:
#                                 connection.execute(text(f"DROP SEQUENCE IF EXISTS {seq_name} CASCADE"))
#                             except Exception as e:
#                                 print(f"Error on deleting seq {seq_name}: {e}")
                        
#                         connection.commit()
                
#                 # Create all table
#                 try:
#                     db.create_all()
#                     break
#                 except Exception as e:
#                     print(f"Error on create table: {e}")
#                     if "duplicate key value violates unique constraint" in str(e) and "relname, relnamespace" in str(e):
#                         with db.engine.connect() as connection:
#                             for model in models:
#                                 table_name = model.__tablename__
#                                 seq_name = f"{table_name}_id_seq"
#                                 try:
#                                     connection.execute(text(f"DROP SEQUENCE IF EXISTS {seq_name} CASCADE"))
#                                 except Exception as seq_e:
#                                     print(f"Error on deleting seq {seq_name}: {seq_e}")
#                             connection.commit()

#                         retry_count += 1
#                         wait_time = 3 * retry_count
#                         print(f"Retry after {wait_time}s, {retry_count} times...")
#                         time.sleep(wait_time)
#                         continue
#                     else:
#                         raise
                
#         except OperationalError as e:
#             retry_count += 1
#             wait_time = 3 * retry_count
#             print(f"db connected in {retry_count} times failed。Retry after {wait_time}s... Error: {e}")
#             time.sleep(wait_time)
#             continue
#         except Exception as e:
#             if "duplicate key value violates unique constraint" in str(e) and "relname, relnamespace" in str(e):
#                 retry_count += 1
#                 wait_time = 3 * retry_count
#                 print(f"Keep duplicate error: {e}")
#                 print(f"Retry after {wait_time}s, {retry_count} times...")
#                 time.sleep(wait_time)
#                 continue
#             else:
#                 print(f"Exception: {e}")
#                 raise
            
#     if retry_count >= max_retries:
#         raise Exception(f"Max retries: ({max_retries}), cannot connect to db")